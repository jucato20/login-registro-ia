/* ============================================================
   login.js — Lógica de la página de inicio de sesión
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  // Si ya hay una sesión activa, vamos directo al dashboard.
  if (getSession()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const formAlert = document.getElementById("formAlert");
  const submitBtn = document.getElementById("submitBtn");
  const identifierInput = document.getElementById("identifier");
  const passwordInput = document.getElementById("password");

  wirePasswordToggle(document.getElementById("togglePassword"), passwordInput);

  // Mensaje de éxito tras registro
  const params = new URLSearchParams(window.location.search);
  if (params.get("registered") === "1") {
    showMessage(formAlert, "Cuenta creada con éxito. Ya puedes iniciar sesión.", "success");
  }
  if (params.get("reset") === "1") {
    showMessage(formAlert, "Contraseña actualizada. Inicia sesión con tu nueva contraseña.", "success");
  }

  let countdownInterval = null;

  function startLockCountdown(identifier) {
    clearInterval(countdownInterval);
    submitBtn.disabled = true;

    const tick = () => {
      const remaining = getRemainingLockMs(identifier);
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        submitBtn.disabled = false;
        clearMessage(formAlert);
        return;
      }
      showMessage(
        formAlert,
        `Demasiados intentos fallidos. Intenta de nuevo en ${formatMs(remaining)}.`,
        "error"
      );
    };

    tick();
    countdownInterval = setInterval(tick, 500);
  }

  // Si el usuario recarga la página estando bloqueado, retomamos el conteo.
  const savedIdentifier = identifierInput.value.trim();
  if (savedIdentifier && getRemainingLockMs(savedIdentifier) > 0) {
    startLockCountdown(savedIdentifier);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(formAlert);
    document.getElementById("err-identifier").textContent = "";
    document.getElementById("err-password").textContent = "";

    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;
    const remember = document.getElementById("remember").checked;

    let hasError = false;
    if (!identifier) {
      document.getElementById("err-identifier").textContent = "Ingresa tu usuario o correo.";
      hasError = true;
    }
    if (!password) {
      document.getElementById("err-password").textContent = "Ingresa tu contraseña.";
      hasError = true;
    }
    if (hasError) return;

    const remainingLock = getRemainingLockMs(identifier);
    if (remainingLock > 0) {
      startLockCountdown(identifier);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    const user = findUser(identifier);
    const passwordOk = user ? await verifyPassword(user, password) : false;

    if (user && passwordOk) {
      resetAttempts(identifier);
      setSession(user.username, remember);
      addAccessHistory(user.username, true);
      showMessage(formAlert, "¡Bienvenido! Redirigiendo...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
      return;
    }

    // Credenciales inválidas
    if (user) addAccessHistory(user.username, false);
    const entry = recordFailedAttempt(identifier);

    submitBtn.disabled = false;
    submitBtn.textContent = "Iniciar sesión";

    if (getRemainingLockMs(identifier) > 0) {
      startLockCountdown(identifier);
    } else {
      const attemptsLeft = getAttemptsLeft(identifier);
      showMessage(
        formAlert,
        `Usuario o contraseña incorrectos. Te quedan ${attemptsLeft} intento(s) antes del bloqueo temporal.`,
        "error"
      );
    }
  });
});
