/* ============================================================
   dashboard.js — Lógica del panel principal (ruta protegida)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const session = requireSession();
  if (!session) return; // requireSession ya redirige a index.html

  const user = findUser(session.username);
  if (!user) {
    clearSession();
    window.location.href = "index.html";
    return;
  }

  /* ------------------------------ Header ----------------------------- */

  document.getElementById("avatarInitials").textContent = getInitials(user.fullName);
  document.getElementById("welcomeText").textContent = `Hola, ${user.fullName.split(" ")[0]} 👋`;
  document.getElementById("welcomeSub").textContent = `@${user.username} · miembro desde ${formatDate(user.createdAt)}`;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });

  /* --------------------------- Modo oscuro --------------------------- */

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");

  function syncThemeUI() {
    const isDark = getTheme() === "dark";
    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeLabel.textContent = isDark ? "Modo claro" : "Modo oscuro";
  }
  syncThemeUI();

  themeToggle.addEventListener("click", () => {
    toggleTheme();
    syncThemeUI();
  });

  /* ------------------------------ Perfil ------------------------------ */

  const profileForm = document.getElementById("profileForm");
  const profileAlert = document.getElementById("profileAlert");
  const usernameInput = document.getElementById("profileUsername");
  const fullNameInput = document.getElementById("profileFullName");
  const emailInput = document.getElementById("profileEmail");
  const securityQuestionInput = document.getElementById("profileSecurityQuestion");

  usernameInput.value = user.username;
  fullNameInput.value = user.fullName;
  emailInput.value = user.email;
  securityQuestionInput.value = user.securityQuestion;

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage(profileAlert);
    document.getElementById("err-profileFullName").textContent = "";
    document.getElementById("err-profileEmail").textContent = "";

    const newFullName = fullNameInput.value.trim();
    const newEmail = emailInput.value.trim();
    let hasError = false;

    if (!newFullName) {
      document.getElementById("err-profileFullName").textContent = "El nombre no puede estar vacío.";
      hasError = true;
    }
    if (!newEmail) {
      document.getElementById("err-profileEmail").textContent = "El correo no puede estar vacío.";
      hasError = true;
    } else if (!isValidEmail(newEmail)) {
      document.getElementById("err-profileEmail").textContent = "Ingresa un correo válido.";
      hasError = true;
    } else {
      const emailOwner = findUser(newEmail);
      if (emailOwner && emailOwner.username !== user.username) {
        document.getElementById("err-profileEmail").textContent = "Ese correo ya está en uso por otra cuenta.";
        hasError = true;
      }
    }

    if (hasError) return;

    updateUser(user.username, { fullName: newFullName, email: newEmail });
    document.getElementById("avatarInitials").textContent = getInitials(newFullName);
    document.getElementById("welcomeText").textContent = `Hola, ${newFullName.split(" ")[0]} 👋`;
    showMessage(profileAlert, "Perfil actualizado con éxito.", "success");
  });

  /* --------------------------- Historial --------------------------- */

  const historyList = document.getElementById("historyList");
  const history = user.accessHistory || [];

  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty-state">Aún no hay accesos registrados.</li>';
  } else {
    historyList.innerHTML = history
      .map((entry) => {
        const dotClass = entry.success ? "history-item__dot--success" : "history-item__dot--fail";
        const label = entry.success ? "Inicio de sesión exitoso" : "Intento fallido";
        return `
          <li class="history-item">
            <span class="history-item__dot ${dotClass}"></span>
            <span class="history-item__text">
              <span class="history-item__label">${label}</span>
              <span class="history-item__date">${formatDate(entry.date)}</span>
            </span>
          </li>
        `;
      })
      .join("");
  }
});
