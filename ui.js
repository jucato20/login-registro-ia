/* ============================================================
   ui.js
   Pequeñas utilidades de interfaz compartidas entre páginas:
   mensajes de alerta, toggle mostrar/ocultar contraseña,
   medidor de fuerza de contraseña.
   ============================================================ */

/**
 * Muestra un mensaje de alerta dentro de un contenedor.
 * type: "error" | "success" | "info"
 */
function showMessage(container, text, type = "info") {
  container.textContent = text;
  container.className = `alert alert--${type}`;
  container.hidden = false;
}

function clearMessage(container) {
  container.textContent = "";
  container.hidden = true;
}

/** Conecta un botón "ojo" con un input de contraseña para alternar su visibilidad. */
function wirePasswordToggle(toggleBtn, input) {
  toggleBtn.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggleBtn.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    toggleBtn.classList.toggle("is-visible", isPassword);
  });
}

const STRENGTH_LABELS = [
  "Muy débil",
  "Muy débil",
  "Débil",
  "Media",
  "Fuerte",
  "Muy fuerte",
];

/** Pinta la barra de fuerza de contraseña (0 a 5) y su etiqueta. */
function renderPasswordStrength(score, barEl, labelEl) {
  const percent = (score / 5) * 100;
  barEl.style.width = `${percent}%`;

  barEl.classList.remove("strength--weak", "strength--medium", "strength--strong");
  if (score <= 2) barEl.classList.add("strength--weak");
  else if (score <= 3) barEl.classList.add("strength--medium");
  else barEl.classList.add("strength--strong");

  labelEl.textContent = STRENGTH_LABELS[score];
}

/** Actualiza la lista de checks (✓/✗) de requisitos de contraseña. */
function renderPasswordChecklist(checks, listEl) {
  const items = listEl.querySelectorAll("[data-check]");
  items.forEach((item) => {
    const key = item.getAttribute("data-check");
    const passed = Boolean(checks[key]);
    item.classList.toggle("check--ok", passed);
    item.classList.toggle("check--pending", !passed);
    const icon = item.querySelector(".check-icon");
    if (icon) icon.textContent = passed ? "✓" : "•";
  });
}

/** Devuelve las iniciales de un nombre completo, en mayúsculas (máx. 2 letras). */
function getInitials(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Formatea una fecha ISO a un string legible en español. */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
