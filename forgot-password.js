/* ============================================================
   forgot-password.js — Flujo de recuperación de contraseña en 3 pasos:
   1) Identificar usuario  2) Responder pregunta de seguridad
   3) Definir nueva contraseña
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const formAlert = document.getElementById("formAlert");
  const step1Form = document.getElementById("step1Form");
  const step2Form = document.getElementById("step2Form");
  const step3Form = document.getElementById("step3Form");
  const dots = [document.getElementById("dot1"), document.getElementById("dot2"), document.getElementById("dot3")];

  let currentUser = null;

  function goToStep(stepNumber) {
    step1Form.hidden = stepNumber !== 1;
    step2Form.hidden = stepNumber !== 2;
    step3Form.hidden = stepNumber !== 3;
    dots.forEach((dot, idx) => dot.classList.toggle("is-active", idx < stepNumber));
    clearMessage(formAlert);
  }

  /* ------------------------------ Paso 1 ------------------------------ */

  step1Form.addEventListener("submit", (event) => {
    event.preventDefault();
    const identifierInput = document.getElementById("identifier");
    const identifier = identifierInput.value.trim();
    const errEl = document.getElementById("err-identifier");

    if (!identifier) {
      errEl.textContent = "Ingresa tu usuario o correo.";
      return;
    }

    const user = findUser(identifier);
    if (!user) {
      errEl.textContent = "";
      showMessage(formAlert, "No encontramos una cuenta con ese usuario o correo.", "error");
      return;
    }

    errEl.textContent = "";
    currentUser = user;
    document.getElementById("securityQuestionLabel").textContent = user.securityQuestion;
    goToStep(2);
  });

  /* ------------------------------ Paso 2 ------------------------------ */

  step2Form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const answerInput = document.getElementById("securityAnswer");
    const errEl = document.getElementById("err-securityAnswer");
    const answer = answerInput.value.trim();

    if (!answer) {
      errEl.textContent = "Escribe una respuesta.";
      return;
    }

    const isCorrect = await verifySecurityAnswer(currentUser, answer);
    if (!isCorrect) {
      errEl.textContent = "";
      showMessage(formAlert, "La respuesta no es correcta. Intenta de nuevo.", "error");
      return;
    }

    errEl.textContent = "";
    goToStep(3);
  });

  /* ------------------------------ Paso 3 ------------------------------ */

  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const strengthBar = document.getElementById("strengthBar");
  const strengthLabel = document.getElementById("strengthLabel");
  const passwordChecklist = document.getElementById("passwordChecklist");

  wirePasswordToggle(document.getElementById("toggleNewPassword"), newPasswordInput);
  wirePasswordToggle(document.getElementById("toggleConfirmNewPassword"), confirmNewPasswordInput);

  newPasswordInput.addEventListener("input", () => {
    const checks = evaluatePassword(newPasswordInput.value);
    const score = passwordStrengthScore(newPasswordInput.value);
    renderPasswordStrength(score, strengthBar, strengthLabel);
    renderPasswordChecklist(checks, passwordChecklist);
  });

  step3Form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;
    const errNew = document.getElementById("err-newPassword");
    const errConfirm = document.getElementById("err-confirmNewPassword");
    errNew.textContent = "";
    errConfirm.textContent = "";

    let hasError = false;
    if (!isPasswordValid(newPassword)) {
      errNew.textContent = "La contraseña no cumple los requisitos mínimos.";
      hasError = true;
    }
    if (newPassword !== confirmNewPassword) {
      errConfirm.textContent = "Las contraseñas no coinciden.";
      hasError = true;
    }
    if (hasError) return;

    await setNewPassword(currentUser.username, newPassword);
    resetAttempts(currentUser.username);
    resetAttempts(currentUser.email);
    showMessage(formAlert, "Contraseña actualizada con éxito. Redirigiendo...", "success");
    setTimeout(() => {
      window.location.href = "index.html?reset=1";
    }, 1200);
  });

  goToStep(1);
});
