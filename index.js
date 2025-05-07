const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();
const port = 2104;

// Kết nối SQLite
let db = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("Lỗi kết nối SQLite:", err.message);
  else console.log("Kết nối SQLite thành công!");
});

// Tạo bảng nếu chưa tồn tại
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user'
)`);

db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

  
// Hàm khởi tạo tài khoản mặc định
function createDefaultAccounts() {
  const hashedAdminPassword = bcrypt.hashSync("admin", 10); // Mật khẩu admin: "admin"
  const hashedUserPassword = bcrypt.hashSync("123", 10); // Mật khẩu user: "123"

  // Tạo tài khoản mặc định nếu chưa tồn tại
  db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, 'admin')", ["admin", hashedAdminPassword]);
  db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, 'user')", ["vinh", hashedUserPassword]);
}

createDefaultAccounts(); // Gọi hàm khởi tạo tài khoản mặc định

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Middleware xác thực token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("Không có token!");

  jwt.verify(token, "secret_key", (err, user) => {
    if (err) return res.status(403).send("Token không hợp lệ!");
    req.user = user;
    next();
  });
}

// Middleware phân quyền admin
function authorizeAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).send("Bạn không có quyền admin!");
  next();
}

// API: Đăng ký người dùng
app.post("/api/register", (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role || "user"], function (err) {
    if (err) res.status(400).send("Tên đăng nhập đã tồn tại!");
    else res.json({ id: this.lastID, username, role: role || "user" });
  });
});

// API: Đăng nhập người dùng
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) return res.status(401).send("Sai thông tin đăng nhập!");

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).send("Sai mật khẩu!");

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      "secret_key",
      { expiresIn: "1h" }
    );

    res.json({ token, avatar: "default-avatar.png" });
  });
});

// API: Xác thực token
app.post("/api/verify-token", authenticateToken, (req, res) => {
  res.json({ success: true, user: { username: req.user.username, role: req.user.role, avatar: "default-avatar.png" } });
});

// API: Lấy danh sách công việc của user
app.get("/api/tasks", authenticateToken, (req, res) => {
  db.all("SELECT * FROM tasks WHERE user_id = ?", [req.user.id], (err, rows) => {
    if (err) res.status(500).send(err.message);
    else res.json(rows);
  });
});

// API: Thêm công việc mới
app.post("/api/tasks", authenticateToken, (req, res) => {
  const { task } = req.body;
  db.run("INSERT INTO tasks (task, user_id) VALUES (?, ?)", [task, req.user.id], function (err) {
    if (err) res.status(500).send(err.message);
    else res.json({ id: this.lastID, task, completed: 0 });
  });
});
  

// API: Xem danh sách tất cả người dùng (admin)
app.get("/api/admin/users", authenticateToken, authorizeAdmin, (req, res) => {
  db.all("SELECT id, username, role FROM users", [], (err, rows) => {
    if (err) res.status(500).send(err.message);
    else res.json(rows);
  });
});

// API: Lọc người dùng theo chữ cái đầu (admin)
app.get("/api/admin/users/filter", authenticateToken, authorizeAdmin, (req, res) => {
    const { letter } = req.query;
    const sql = "SELECT id, username, role FROM users WHERE username LIKE ?";
    const params = [`${letter}%`];
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: "Lỗi trong API lọc" });
      } else {
        res.json(rows);
      }
    });
  });
  
  

// API: Tìm kiếm người dùng theo tên (admin)
app.get("/api/admin/users/search", authenticateToken, authorizeAdmin, (req, res) => {
    const { query } = req.query;
    const sql = "SELECT id, username, role FROM users WHERE username LIKE ?";
    const params = [`%${query}%`];
    db.all(sql, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: "Lỗi trong API tìm kiếm" });
      } else {
        res.json(rows);
      }
    });
  });
  
// API: Xem danh sách tất cả công việc của mọi user (admin)
app.get("/api/admin/tasks", authenticateToken, authorizeAdmin, (req, res) => {
  db.all(
    "SELECT tasks.*, users.username FROM tasks JOIN users ON tasks.user_id = users.id",
    [],
    (err, rows) => {
      if (err) res.status(500).send(err.message);
      else res.json(rows);
    }
  );
});

app.patch("/api/tasks/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
  
    if (typeof completed === "undefined") {
      return res.status(400).send("Thiếu trường 'completed'!");
    }
  
    db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, task) => {
      if (err || !task) {
        return res.status(404).send("Công việc không tồn tại!");
      }
  
      db.run("UPDATE tasks SET completed = ? WHERE id = ?", [completed ? 1 : 0, id], function (err) {
        if (err) {
          console.error("Lỗi khi cập nhật trạng thái công việc:", err.message);
          return res.status(500).send("Lỗi khi cập nhật trạng thái công việc!");
        }
        res.json({ success: true, completed });
      });
    });
  });
  
  
  // API: Xóa công việc
app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
  
    db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, task) => {
        if (err || !task) {
          return res.status(404).send("Công việc không tồn tại!");
        }
      });
      
    db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).send("Lỗi khi xóa công việc!");
      } else {
        res.sendStatus(204); // Thành công
      }
    });
  });
  
// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
