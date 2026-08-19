/* ============================================================
   register.js — Lógica de la página de registro
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const form = document.getElementById("registerForm");
  const formAlert = document.getElementById("formAlert");
  const submitBtn = document.getElementById("submitBtn");

  const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),
    securityQuestion: document.getElementById("securityQuestion"),
    securityAnswer: document.getElementById("securityAnswer"),
  };

  const strengthBar = document.getElementById("strengthBar");
  const strengthLabel = document.getElementById("strengthLabel");
  const passwordChecklist = document.getElementById("passwordChecklist");

  wirePasswordToggle(document.getElementById("togglePassword"), fields.password);
  wirePasswordToggle(document.getElementById("toggleConfirmPassword"), fields.confirmPassword);

  function setFieldError(name, message) {
    const errorEl = document.getElementById(`err-${name}`);
    const inputEl = fields[name];
    if (errorEl) errorEl.textContent = message || "";
    if (inputEl) {
      inputEl.classList.toggle("input--error", Boolean(message));
      inputEl.classList.toggle("input--valid", !message && inputEl.value.trim() !== "");
    }
  }

  /* -------------------- Validación en tiempo real -------------------- */

  fields.fullName.addEventListener("input", () => {
    setFieldError("fullName", fields.fullName.value.trim() ? "" : "");
  });

  fields.email.addEventListener("blur", () => {
    const value = fields.email.value.trim();
    if (!value) return setFieldError("email", "");
    setFieldError("email", isValidEmail(value) ? "" : "Ingresa un correo válido.");
  });

  fields.username.addEventListener("blur", () => {
    const value = fields.username.value.trim();
    if (!value) return setFieldError("username", "");
    if (value.length < 3) {
      setFieldError("username", "El usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (usernameOrEmailTaken(value, "__no_match__")) {
      setFieldError("username", "Ese usuario ya está en uso.");
    } else {
      setFieldError("username", "");
    }
  });

  fields.password.addEventListener("input", () => {
    const checks = evaluatePassword(fields.password.value);
    const score = passwordStrengthScore(fields.password.value);
    renderPasswordStrength(score, strengthBar, strengthLabel);
    renderPasswordChecklist(checks, passwordChecklist);

    if (fields.confirmPassword.value) {
      validateConfirmPassword();
    }
  });

  function validateConfirmPassword() {
    if (fields.confirmPassword.value !== fields.password.value) {
      setFieldError("confirmPassword", "Las contraseñas no coinciden.");
      return false;
    }
    setFieldError("confirmPassword", "");
    return true;
  }

  fields.confirmPassword.addEventListener("input", validateConfirmPassword);

  /* ---------------------------- Envío del form --------------------------- */

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(formAlert);

    let hasError = false;
    const values = {
      fullName: fields.fullName.value.trim(),
      email: fields.email.value.trim(),
      username: fields.username.value.trim(),
      password: fields.password.value,
      confirmPassword: fields.confirmPassword.value,
      securityQuestion: fields.securityQuestion.value,
      securityAnswer: fields.securityAnswer.value.trim(),
    };

    if (!values.fullName) {
      setFieldError("fullName", "El nombre completo es obligatorio.");
      hasError = true;
    }

    if (!values.email) {
      setFieldError("email", "El correo es obligatorio.");
      hasError = true;
    } else if (!isValidEmail(values.email)) {
      setFieldError("email", "Ingresa un correo válido.");
      hasError = true;
    }

    if (!values.username) {
      setFieldError("username", "El usuario es obligatorio.");
      hasError = true;
    } else if (values.username.length < 3) {
      setFieldError("username", "El usuario debe tener al menos 3 caracteres.");
      hasError = true;
    }

    if (!values.password) {
      setFieldError("password", "La contraseña es obligatoria.");
      hasError = true;
    } else if (!isPasswordValid(values.password)) {
      setFieldError("password", "La contraseña no cumple los requisitos mínimos.");
      hasError = true;
    }

    if (!values.confirmPassword) {
      setFieldError("confirmPassword", "Confirma tu contraseña.");
      hasError = true;
    } else if (!validateConfirmPassword()) {
      hasError = true;
    }

    if (!values.securityQuestion) {
      setFieldError("securityQuestion", "Selecciona una pregunta de seguridad.");
      hasError = true;
    }

    if (!values.securityAnswer) {
      setFieldError("securityAnswer", "Escribe una respuesta.");
      hasError = true;
    }

    if (hasError) {
      showMessage(formAlert, "Revisa los campos marcados en rojo.", "error");
      return;
    }

    if (usernameOrEmailTaken(values.username, values.email)) {
      showMessage(formAlert, "Ese usuario o correo ya está registrado.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Creando cuenta...";

    try {
      await createUser(values);
      showMessage(formAlert, "¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...", "success");
      setTimeout(() => {
        window.location.href = "index.html?registered=1";
      }, 1200);
    } catch (err) {
      console.error(err);
      showMessage(formAlert, "Ocurrió un error al crear la cuenta. Intenta de nuevo.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Crear cuenta";
    }
  });
});
