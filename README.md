# AuthApp — Módulo de Autenticación (Login & Registro)

Proyecto desarrollado para la actividad **"Desarrollo de Login y Registro con Inteligencia Artificial"**, usando IA como asistente durante el proceso de desarrollo, análisis y toma de decisiones sobre el diseño y funcionamiento final.

## 🔗 Demo

> Reemplaza este enlace por tu URL de GitHub Pages una vez publicado el proyecto (ver guía de despliegue más abajo).

`https://<tu-usuario>.github.io/<nombre-del-repositorio>/`

## 🧱 Tecnologías

HTML5, CSS3 (variables CSS, sin frameworks) y JavaScript puro (Vanilla JS). No requiere backend ni instalación de dependencias: el proyecto es 100% estático y funciona directamente en el navegador.

## 📁 Estructura del proyecto

```
auth-app/
├── index.html              → Página de Login (punto de entrada)
├── register.html           → Página de Registro
├── forgot-password.html    → Recuperación de contraseña (3 pasos)
├── dashboard.html           → Panel principal (ruta protegida)
├── css/
│   └── styles.css          → Estilos, tema claro/oscuro, responsive
├── js/
│   ├── storage.js          → "Backend" simulado: usuarios, sesión, bloqueo, hashing
│   ├── ui.js                → Utilidades de interfaz (alertas, toggle password, etc.)
│   ├── login.js             → Lógica de inicio de sesión
│   ├── register.js          → Lógica de registro
│   ├── forgot-password.js   → Lógica de recuperación de contraseña
│   └── dashboard.js         → Lógica del dashboard
└── README.md
```

## ✅ Funcionalidades

### Registro
Nombre completo, correo, usuario, contraseña y confirmación. Valida campos obligatorios, formato de correo, requisitos mínimos de contraseña y coincidencia entre contraseñas, todo en tiempo real mientras el usuario escribe.

### Login
Acceso con usuario o correo + contraseña, mensajes de error/éxito, opción de mostrar u ocultar la contraseña y acceso al Dashboard tras iniciar sesión correctamente, con opción de cerrar sesión.

### Funcionalidades adicionales (más de las 2 mínimas requeridas)

1. **Indicador de fuerza de contraseña**: barra visual y checklist que evalúan la contraseña en tiempo real (longitud, mayúscula, minúscula, número, carácter especial).
2. **Bloqueo temporal por intentos fallidos**: tras 5 intentos incorrectos, el login se bloquea 30 segundos con una cuenta regresiva visible.
3. **Recordar sesión**: casilla en el login que decide si la sesión persiste al cerrar el navegador (localStorage) o solo dura la pestaña activa (sessionStorage).
4. **Recuperación de contraseña con pregunta de seguridad**: flujo de 3 pasos (identificar cuenta → responder pregunta de seguridad → definir nueva contraseña) definida por el usuario durante el registro.
5. **Perfil de usuario editable + Modo oscuro**: el usuario puede actualizar su nombre y correo desde el Dashboard, y alternar entre tema claro/oscuro (con persistencia entre sesiones).
6. **Historial de accesos**: el Dashboard muestra los últimos inicios de sesión exitosos y fallidos, con fecha y hora.

### Seguridad (a nivel educativo)
Las contraseñas y respuestas de seguridad **no se guardan en texto plano**: se almacenan como hash SHA-256 usando la Web Crypto API del navegador. Esto es solo un ejercicio didáctico — un proyecto en producción real necesitaría un backend, HTTPS, *salting*, *rate limiting* del lado del servidor, etc.

## ⚠️ Cómo funciona el "backend" (importante para la sustentación)

Este proyecto **no tiene servidor**. Toda la información (usuarios registrados, sesión activa, tema, intentos fallidos) se guarda en el navegador mediante `localStorage` / `sessionStorage`. Esto significa que:

- Los usuarios registrados solo existen en el navegador donde se registraron (no se comparten entre dispositivos).
- Si el usuario borra los datos del sitio o usa "modo incógnito", pierde su cuenta.
- Es una solución válida y común para proyectos educativos y demos alojadas en GitHub Pages, que solo permite hosting estático.

## 🚀 Ejecutar en local

No requiere instalación. Basta con abrir `index.html` en el navegador, o servir la carpeta con cualquier servidor estático, por ejemplo:

```bash
npx serve .
# o
python3 -m http.server 8000
```

## 🧪 Pruebas realizadas

Se validó el flujo completo (registro → validaciones → login correcto/incorrecto → bloqueo temporal → recordar sesión → dashboard → edición de perfil → modo oscuro → historial de accesos → cierre de sesión → recuperación de contraseña) de forma automatizada con Playwright, sin errores de consola relacionados con la aplicación.
