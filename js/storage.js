/* ============================================================
   storage.js
   Capa de "backend" simulado con localStorage / sessionStorage.
   Centraliza: usuarios, sesión, bloqueo por intentos, tema,
   historial de accesos y utilidades de validación/seguridad.

   NOTA PEDAGÓGICA: este proyecto no tiene un servidor real.
   Todo se guarda en el navegador. Las contraseñas y respuestas
   de seguridad se guardan como hash SHA-256 (no en texto plano),
   pero esto NO reemplaza un backend real con salting, bcrypt,
   HTTPS, etc. Es solo para fines educativos.
   ============================================================ */

const DB_KEYS = {
  USERS: "authapp_users",
  SESSION: "authapp_session",
  THEME: "authapp_theme",
  LOCKOUT: "authapp_lockout",
};

const LOCKOUT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCK_DURATION_MS: 30 * 1000, // 30 segundos de bloqueo
};

/* ---------------------- Utilidades genéricas ---------------------- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`No se pudo leer ${key} de localStorage`, err);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Genera un hash SHA-256 en hexadecimal a partir de un texto. */
async function hashText(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function nowISO() {
  return new Date().toISOString();
}

/* ---------------------------- Usuarios ---------------------------- */

function getUsers() {
  return readJSON(DB_KEYS.USERS, []);
}

function saveUsers(users) {
  writeJSON(DB_KEYS.USERS, users);
}

/** Busca un usuario por su username o su correo (case-insensitive). */
function findUser(identifier) {
  const id = identifier.trim().toLowerCase();
  return getUsers().find(
    (u) => u.username.toLowerCase() === id || u.email.toLowerCase() === id
  );
}

function usernameOrEmailTaken(username, email) {
  const u = username.trim().toLowerCase();
  const e = email.trim().toLowerCase();
  return getUsers().some(
    (usr) => usr.username.toLowerCase() === u || usr.email.toLowerCase() === e
  );
}

async function createUser({
  fullName,
  email,
  username,
  password,
  securityQuestion,
  securityAnswer,
}) {
  const users = getUsers();
  const passwordHash = await hashText(password);
  const securityAnswerHash = await hashText(
    securityAnswer.trim().toLowerCase()
  );

  const newUser = {
    fullName: fullName.trim(),
    email: email.trim(),
    username: username.trim(),
    passwordHash,
    securityQuestion,
    securityAnswerHash,
    theme: null,
    createdAt: nowISO(),
    accessHistory: [],
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

function updateUser(username, updates) {
  const users = getUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  return users[idx];
}

async function verifyPassword(user, password) {
  const hash = await hashText(password);
  return hash === user.passwordHash;
}

async function verifySecurityAnswer(user, answer) {
  const hash = await hashText(answer.trim().toLowerCase());
  return hash === user.securityAnswerHash;
}

async function setNewPassword(username, newPassword) {
  const passwordHash = await hashText(newPassword);
  return updateUser(username, { passwordHash });
}

/** Agrega un registro al historial de accesos (máx. 10 entradas). */
function addAccessHistory(username, success) {
  const users = getUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (idx === -1) return;
  const history = users[idx].accessHistory || [];
  history.unshift({ date: nowISO(), success });
  users[idx].accessHistory = history.slice(0, 10);
  saveUsers(users);
}

/* ----------------------------- Sesión ----------------------------- */

/**
 * Guarda la sesión activa.
 * remember=true  -> localStorage (persiste al cerrar el navegador)
 * remember=false -> sessionStorage (se pierde al cerrar la pestaña)
 */
function setSession(username, remember) {
  const payload = JSON.stringify({ username, loginAt: nowISO() });
  if (remember) {
    localStorage.setItem(DB_KEYS.SESSION, payload);
    sessionStorage.removeItem(DB_KEYS.SESSION);
  } else {
    sessionStorage.setItem(DB_KEYS.SESSION, payload);
    localStorage.removeItem(DB_KEYS.SESSION);
  }
}

function getSession() {
  const raw =
    sessionStorage.getItem(DB_KEYS.SESSION) ||
    localStorage.getItem(DB_KEYS.SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(DB_KEYS.SESSION);
  localStorage.removeItem(DB_KEYS.SESSION);
}

/** Redirige a login si no hay una sesión activa. Úsalo en páginas protegidas. */
function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

/* ------------------------- Bloqueo por intentos ------------------------- */

function getLockoutMap() {
  return readJSON(DB_KEYS.LOCKOUT, {});
}

function saveLockoutMap(map) {
  writeJSON(DB_KEYS.LOCKOUT, map);
}

/** Devuelve los ms restantes de bloqueo (0 si no está bloqueado). */
function getRemainingLockMs(identifier) {
  const map = getLockoutMap();
  const entry = map[identifier.trim().toLowerCase()];
  if (!entry || !entry.lockUntil) return 0;
  const remaining = entry.lockUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

function recordFailedAttempt(identifier) {
  const id = identifier.trim().toLowerCase();
  const map = getLockoutMap();
  const entry = map[id] || { count: 0, lockUntil: 0 };

  entry.count += 1;
  if (entry.count >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
    entry.lockUntil = Date.now() + LOCKOUT_CONFIG.LOCK_DURATION_MS;
    entry.count = 0; // reinicia el contador tras aplicar el bloqueo
  }
  map[id] = entry;
  saveLockoutMap(map);
  return entry;
}

function resetAttempts(identifier) {
  const id = identifier.trim().toLowerCase();
  const map = getLockoutMap();
  delete map[id];
  saveLockoutMap(map);
}

function getAttemptsLeft(identifier) {
  const id = identifier.trim().toLowerCase();
  const map = getLockoutMap();
  const entry = map[id];
  const used = entry ? entry.count : 0;
  return Math.max(LOCKOUT_CONFIG.MAX_ATTEMPTS - used, 0);
}

/* ------------------------------- Tema ------------------------------- */

function getTheme() {
  return localStorage.getItem(DB_KEYS.THEME) || "light";
}

function setTheme(theme) {
  localStorage.setItem(DB_KEYS.THEME, theme);
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/** Debe llamarse en cada página al cargar, antes de pintar contenido. */
function initTheme() {
  applyTheme(getTheme());
}

/* --------------------------- Validaciones --------------------------- */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Evalúa la contraseña contra reglas mínimas de seguridad.
 * Devuelve un objeto con cada regla cumplida o no.
 */
function evaluatePassword(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function isPasswordValid(password) {
  const checks = evaluatePassword(password);
  return Object.values(checks).every(Boolean);
}

/**
 * Calcula un puntaje de fuerza de 0 a 4 para el indicador visual.
 * 0-1: muy débil, 2: débil, 3: media, 4: fuerte, 5: muy fuerte
 */
function passwordStrengthScore(password) {
  if (!password) return 0;
  const checks = evaluatePassword(password);
  let score = Object.values(checks).filter(Boolean).length;
  if (password.length >= 12 && score === 5) score = 5;
  return score; // 0..5
}

function formatMs(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
