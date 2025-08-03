
// ==== Web tĩnh: Xử lý toàn bộ logic phía client bằng LocalStorage ====

// Dữ liệu mẫu mặc định
const DEFAULT_USERS = [
  { id: 1, username: "admin", password: "admin", role: "admin" },
  { id: 2, username: "vinh", password: "123", role: "user" }
];
if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify(DEFAULT_USERS));
}
if (!localStorage.getItem("tasks")) {
  localStorage.setItem("tasks", JSON.stringify([]));
}

function getUsers() { return JSON.parse(localStorage.getItem("users")); }
function setUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }
function getTasks() { return JSON.parse(localStorage.getItem("tasks")); }
function setTasks(tasks) { localStorage.setItem("tasks", JSON.stringify(tasks)); }

function getCurrentUser() { return JSON.parse(localStorage.getItem("currentUser")); }
function setCurrentUser(user) { localStorage.setItem("currentUser", JSON.stringify(user)); }
function logout() {
  localStorage.removeItem("currentUser");
  document.getElementById("user-info").style.display = "none";
  document.getElementById("header-buttons").style.display = "flex";
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("task-section").style.display = "none";
  alert("Bạn đã đăng xuất!");
}

function showUserInfo(user) {
  document.getElementById("user-info").style.display = "flex";
  document.getElementById("user-avatar").src = "default-avatar.png";
  document.getElementById("user-name").innerText = user.username;
  document.getElementById("header-buttons").style.display = "none";
}

function showAdminPanel() {
  document.getElementById("admin-panel").style.display = "block";
  document.getElementById("task-section").style.display = "none";
  displayUsers(getAllUsers());
  displayTasks(getAllTasksWithUser());
}
function showUserTasksPanel() {
  document.getElementById("task-section").style.display = "block";
  document.getElementById("admin-panel").style.display = "none";
  displayUserTasks();
}
function handleRoleSwitch(user) {
  if (user.role === "admin") showAdminPanel();
  else showUserTasksPanel();
}

// Đăng ký
document.getElementById("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  let users = getUsers();
  if (users.some(u => u.username === username)) {
    alert("Tên đăng nhập đã tồn tại!");
    return;
  }
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const user = { id, username, password, role: "user" };
  users.push(user);
  setUsers(users);
  alert("Đăng ký thành công!");
  hideModal("register-section");
});

// Đăng nhập
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    setCurrentUser(user);
    showUserInfo(user);
    handleRoleSwitch(user);
    alert("Đăng nhập thành công!");
    hideModal("login-section");
  } else {
    alert("Sai thông tin đăng nhập!");
  }
});

// Khi tải trang, kiểm tra trạng thái đăng nhập
document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (user) {
    showUserInfo(user);
    handleRoleSwitch(user);
  }
});

// Thêm công việc
function addTask() {
  const input = document.getElementById("task-input");
  const task = input.value.trim();
  if (!task) {
    alert("Bạn phải nhập công việc!");
    return;
  }
  const user = getCurrentUser();
  let tasks = getTasks();
  const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
  tasks.push({ id, task, completed: false, user_id: user.id });
  setTasks(tasks);
  input.value = "";
  displayUserTasks();
  showNotification("Công việc đã được thêm thành công!");
}

function displayUserTasks() {
  const user = getCurrentUser();
  const tasks = getTasks().filter(t => t.user_id === user.id);
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "";
  tasks.forEach(task => appendTask(task));
}

function appendTask(task) {
  const li = document.createElement("li");
  li.className = task.completed ? "checked" : "";
  const taskContent = document.createElement("span");
  taskContent.innerText = task.task;
  taskContent.onclick = () => {
    toggleTaskCompletion(task.id, li);
  };
  const deleteBtn = document.createElement("span");
  deleteBtn.className = "close";
  deleteBtn.innerText = "X";
  deleteBtn.onclick = () => { deleteTask(task.id); li.remove(); showNotification("Công việc đã được xóa!"); };
  li.appendChild(taskContent);
  li.appendChild(deleteBtn);
  document.getElementById("task-list").appendChild(li);
}

function deleteTask(id) {
  let tasks = getTasks();
  tasks = tasks.filter(t => t.id !== id);
  setTasks(tasks);
}

function toggleTaskCompletion(id, element) {
  let tasks = getTasks();
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  setTasks(tasks);
  element.classList.toggle("checked");
}

// ==== ADMIN ==== //
function getAllUsers() { return getUsers(); }
function filterUsers(letter) { displayUsers(getUsers().filter(u => u.username.startsWith(letter))); }
function searchUsers() {
  const query = document.getElementById("user-search").value;
  displayUsers(getUsers().filter(u => u.username.includes(query)));
}
function displayUsers(users) {
  const userTable = document.getElementById("user-table");
  userTable.innerHTML = `<tr><th>ID</th><th>Người dùng</th><th>Vai trò</th></tr>`;
  if (users.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="3" style="text-align: center;">Không có người dùng phù hợp</td>`;
    userTable.appendChild(row);
  } else {
    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${user.id}</td><td>${user.username}</td><td>${user.role}</td>`;
      userTable.appendChild(row);
    });
  }
}
function getAllTasksWithUser() {
  const users = getUsers();
  return getTasks().map(t => ({ ...t, username: users.find(u => u.id === t.user_id)?.username || "" }));
}
function displayTasks(tasks) {
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
}

function showRegister() {
  const registerSection = document.getElementById("register-section");
  if (registerSection) registerSection.style.display = "flex";
}
function showLogin() {
  const loginSection = document.getElementById("login-section");
  if (loginSection) loginSection.style.display = "flex";
}
function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}
function showNotification(message) {
  const notification = document.getElementById("notification");
  const notificationMessage = document.getElementById("notification-message");
  notificationMessage.innerText = message;
  notification.style.display = "block";
  setTimeout(() => { notification.style.display = "none"; }, 3000);
}
  