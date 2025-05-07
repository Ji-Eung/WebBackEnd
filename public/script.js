// Kiểm tra trạng thái đăng nhập khi tải trang
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showUserInfo(data.user);
            handleRoleSwitch(data.user);
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch((error) => console.error("Lỗi xác thực token:", error));
    }
  });
  
  // Hiển thị thông tin người dùng
  function showUserInfo(user) {
    document.getElementById("user-info").style.display = "flex";
    document.getElementById("user-avatar").src = user.avatar || "default-avatar.png";
    document.getElementById("user-name").innerText = user.username;
    document.getElementById("header-buttons").style.display = "none";
  }
  
// Hiển thị Admin Panel và tải danh sách người dùng mặc định
function showAdminPanel() {
    document.getElementById("admin-panel").style.display = "block";
    document.getElementById("task-section").style.display = "none";
    fetchUsers(); // Tải danh sách người dùng
    fetchTasks(); // Tải danh sách công việc
  }

  // Hiển thị User Panel
  function showUserTasksPanel() {
    document.getElementById("task-section").style.display = "block";
    document.getElementById("admin-panel").style.display = "none";
    fetchUserTasks();
  }
  
  // Đăng xuất
  function logout() {
    localStorage.removeItem("token");
    document.getElementById("user-info").style.display = "none";
    document.getElementById("header-buttons").style.display = "flex";
    document.getElementById("admin-panel").style.display = "none";
    document.getElementById("task-section").style.display = "none";
    alert("Bạn đã đăng xuất!");
  }
  // Hiển thị modal
function showRegister() {
    const registerSection = document.getElementById("register-section");
    if (registerSection) {
      registerSection.style.display = "flex";
    } else {
      console.error("Không tìm thấy phần Đăng ký!");
    }
  }
  
  function showLogin() {
    const loginSection = document.getElementById("login-section");
    if (loginSection) {
      loginSection.style.display = "flex";
    } else {
      console.error("Không tìm thấy phần Đăng nhập!");
    }
  }
  
  // Ẩn modal
  function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = "none";
    } else {
      console.error(`Không tìm thấy modal với ID: ${id}`);
    }
  }
  
  // Xử lý chuyển đổi giữa các vai trò
  function handleRoleSwitch(user) {
    if (user.role === "admin") {
      showAdminPanel(); // Hiển thị giao diện Admin
    } else {
      showUserTasksPanel(); // Hiển thị giao diện User
    }
  }
  
  // Xử lý Đăng ký
  document.getElementById("register-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        if (response.ok) {
          alert("Đăng ký thành công!");
          hideModal("register-section");
        } else {
          alert("Tên đăng nhập đã tồn tại!");
        }
      })
      .catch((error) => console.error("Lỗi đăng ký:", error));
  });
  
  // Xử lý Đăng nhập
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
  
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token); // Lưu token đăng nhập
          showUserInfo({ username, role: data.role, avatar: data.avatar }); // Hiển thị thông tin user
          handleRoleSwitch(data); // Chuyển đổi giao diện ngay lập tức
          alert("Đăng nhập thành công!");
          hideModal("login-section");
        } else {
          alert("Sai thông tin đăng nhập!");
        }
      })
      .catch((error) => console.error("Lỗi đăng nhập:", error));
  });
  
  // Thêm công việc
  function addTask() {
    const input = document.getElementById("task-input");
    const task = input.value.trim();
    if (!task) {
      alert("Bạn phải nhập công việc!");
      return;
    }
    const token = localStorage.getItem("token");
    fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task }),
    })
      .then((response) => response.json())
      .then((data) => {
        appendTask(data);
        input.value = "";
      })
      .catch((error) => console.error("Lỗi khi thêm công việc:", error));
  }
  
  // Lấy công việc của User
  function fetchUserTasks() {
    const token = localStorage.getItem("token");
    fetch("/api/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((tasks) => {
        const taskList = document.getElementById("task-list");
        taskList.innerHTML = "";
        tasks.forEach((task) => appendTask(task));
      })
      .catch((error) => console.error("Lỗi khi tải công việc:", error));
  }
  
  // Thêm công việc vào danh sách
  function appendTask(task) {
    const li = document.createElement("li");
    li.className = task.completed ? "checked" : ""; // Gạch ngang nếu đã hoàn thành
  
    // Nội dung công việc
    const taskContent = document.createElement("span");
    taskContent.innerText = task.task;
    taskContent.onclick = () => {
      console.log(`Task ID: ${task.id} được nhấn.`);
      toggleTaskCompletion(task.id, li);
    };
    
    // Nút xóa công việc
    const deleteBtn = document.createElement("span");
    deleteBtn.className = "close";
    deleteBtn.innerText = "X";
    deleteBtn.onclick = () => deleteTask(task.id, li);
  
    li.appendChild(taskContent);
    li.appendChild(deleteBtn);
    document.getElementById("task-list").appendChild(li);
  }
  
  function deleteTask(taskId, element) {
    const token = localStorage.getItem("token");
    fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi xóa công việc.");
        }
        element.remove(); // Xóa phần tử khỏi danh sách
        showNotification("Công việc đã được xóa!");
      })
      .catch((error) => console.error("Lỗi khi xóa công việc:", error));
  }
  
  function toggleTaskCompletion(taskId, element) {
    const isCompleted = !element.classList.contains("checked"); // Đổi trạng thái
    const token = localStorage.getItem("token");
  
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: isCompleted }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi cập nhật trạng thái công việc.");
        }
        return response.json();
      })
      .then((data) => {
        element.classList.toggle("checked"); // Cập nhật giao diện
        showNotification(`Công việc đã được ${isCompleted ? "hoàn thành" : "chưa hoàn thành"}!`);
      })
      .catch((error) => console.error("Lỗi khi cập nhật trạng thái:", error));
  }
  
  

 // Lấy danh sách người dùng (Admin)
function fetchUsers() {
    const token = localStorage.getItem("token");
    fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((users) => displayUsers(users))
      .catch((error) => console.error("Lỗi khi tải danh sách người dùng:", error));
  }
  
  // Lọc Người dùng
  function filterUsers(letter) {
    const token = localStorage.getItem("token");
    fetch(`/api/admin/users/filter?letter=${letter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi gọi API lọc");
        }
        return response.json();
      })
      .then((users) => displayUsers(users))
      .catch((error) => console.error("Lỗi khi lọc người dùng:", error));
  }  
  
  // Tìm kiếm Người dùng
  function searchUsers() {
    const query = document.getElementById("user-search").value;
    const token = localStorage.getItem("token");
    fetch(`/api/admin/users/search?query=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lỗi khi gọi API tìm kiếm");
        }
        return response.json();
      })
      .then((users) => displayUsers(users))
      .catch((error) => console.error("Lỗi khi tìm kiếm người dùng:", error));
  }
  
// Hiển thị danh sách người dùng
function displayUsers(users) {
    const userTable = document.getElementById("user-table");
    userTable.innerHTML = `<tr><th>ID</th><th>Người dùng</th><th>Vai trò</th></tr>`;
    if (users.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="2" style="text-align: center;">Không có người dùng phù hợp</td>`;
      userTable.appendChild(row);
    } else {
      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${user.id}</td><td>${user.username}</td><td>${user.role}</td>`;
        userTable.appendChild(row);
      });
    }
  }

  // Hiển thị danh sách công việc (Admin Panel)
function fetchTasks() {
    const token = localStorage.getItem("token");
    fetch("/api/admin/tasks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((tasks) => {
        const taskTable = document.getElementById("task-table");
        taskTable.innerHTML = `<tr><th>ID</th><th>Công việc</th><th>Người dùng</th><th>Hoàn thành</th></tr>`;
        if (tasks.length === 0) {
          const row = document.createElement("tr");
          row.innerHTML = `<td colspan="4" style="text-align: center;">Không có công việc nào</td>`;
          taskTable.appendChild(row);
        } else {
          tasks.forEach((task) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${task.id}</td>
              <td>${task.task}</td>
              <td>${task.username}</td>
              <td>${task.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}</td>
            `;
            taskTable.appendChild(row);
          });
        }
      })
      .catch((error) => console.error("Lỗi khi tải danh sách công việc:", error));
  }
  
  // Hiển thị bảng trống khi không có dữ liệu
  function displayEmptyTable(tableId) {
    const table = document.getElementById(tableId);
    table.innerHTML = `<tr><td colspan="4" style="text-align: center;">Không có dữ liệu</td></tr>`;
  }
  
  // Sửa lỗi load lại trang để hiển thị đúng giao diện vai trò
  document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/verify-token", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showUserInfo(data.user);
            handleRoleSwitch(data.user); // Hiển thị giao diện đúng theo vai trò
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch((error) => console.error("Lỗi khi xác thực:", error));
    }
  });
  
  function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");
    notificationMessage.innerText = message;
    notification.style.display = "block";
  
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }
  
  // Ví dụ: Gọi thông báo sau khi thêm công việc
  function addTask() {
    const input = document.getElementById("task-input");
    const task = input.value.trim();
    if (!task) {
      alert("Bạn phải nhập công việc!");
      return;
    }
  
    const token = localStorage.getItem("token");
    fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task }),
    })
      .then((response) => response.json())
      .then((data) => {
        appendTask(data); // Hiển thị công việc mới
        input.value = ""; // Xóa ô nhập
        showNotification("Công việc đã được thêm thành công!"); // Hiển thị thông báo
      })
      .catch((error) => console.error("Lỗi khi thêm công việc:", error));
  }
  