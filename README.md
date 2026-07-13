# TREGO Web 

> Aplicación web de **TREGO**, una plataforma de pedidos de comida en línea desarrollada como proyecto final de la carrera **Tecnólogo en Informática**.

TREGO Web permite la gestión de la plataforma desde distintos perfiles de usuario. A través de una interfaz moderna e intuitiva, los restaurantes pueden administrar su catálogo de productos y pedidos, mientras que los administradores supervisan el funcionamiento general del sistema y gestionan la incorporación de nuevos establecimientos.

---

# 🔗 Enlaces

| Recurso | Enlace |
|----------|---------|
| 🌐 Aplicación desplegada | https://trego-theta.vercel.app/ |
| 💻 Repositorio Web | https://github.com/Pino3001/Trego-Web |
| 📱 Aplicación Android | https://github.com/Pino3001/Trego-android |
| ⚙️ Backend REST | https://github.com/neimex23/Trego-Backend |
| 🚀 Repositorio del Deploy (Vercel) | https://github.com/neimex23/Trego-Web |

---

# 🚀 Características

## Restaurante

- 🍽️ Gestión de productos, platos, artículos y combos.
- 🏷️ Creación y administración de ofertas.
- 📦 Gestión de pedidos recibidos.
- 📍 Configuración de zonas y radios de entrega.
- 🖼️ Administración de imágenes mediante Cloudinary.
- ⭐ Consulta de comentarios y calificaciones de los clientes.

## Administrador

- 🏪 Alta y validación de restaurantes.
- 👥 Gestión de usuarios.
- 🍴 Administración de categorías gastronómicas.
- 📊 Supervisión general del funcionamiento de la plataforma.

---

# 📋 Funcionalidades implementadas

- Autenticación mediante Firebase Authentication.
- Administración de restaurantes.
- Gestión de productos, platos, artículos y combos.
- Gestión de ofertas promocionales.
- Gestión de pedidos.
- Configuración de zonas y radios de entrega.
- Administración de imágenes con Cloudinary.
- Consulta de comentarios y calificaciones.
- Panel administrativo para la gestión de usuarios y validación de restaurantes.

---

# 🏗️ Arquitectura

La aplicación fue desarrollada utilizando **React** y **Vite**, siguiendo una arquitectura modular basada en componentes reutilizables y separación de responsabilidades.

La comunicación con el backend se realiza mediante una API REST, utilizando principalmente **Fetch API** y, en algunos servicios específicos, **Axios**. La autenticación es gestionada por **Firebase Authentication**, mientras que **Cloudinary** se utiliza para el almacenamiento de imágenes.

El proyecto incorpora además definiciones de tipos mediante archivos **TypeScript (`.d.ts`)**, facilitando la integración con determinados módulos sin que la aplicación esté desarrollada completamente en TypeScript.

```text
Browser
    │
    ▼
React + Vite
├── Components
├── Pages
├── Context
├── Hooks
├── API (Fetch / Axios)
├── Utils
└── Assets
    │
    ▼
REST API ─────────────► Backend TREGO
    │
    ├── Firebase Authentication
    ├── Cloudinary
    └── Geoapify
```

---

# 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| React 19 | Biblioteca para la interfaz de usuario |
| JavaScript (ES6+) | Lenguaje principal |
| TypeScript (.d.ts) | Definiciones de tipos |
| Vite | Bundler y entorno de desarrollo |
| React Router | Navegación entre vistas |
| TailwindCSS | Estilos |
| Fetch API | Consumo principal de la API REST |
| Axios | Consumo de servicios específicos |
| Firebase Authentication | Autenticación |
| Cloudinary | Gestión de imágenes |
| Geoapify | Geocodificación y autocompletado de direcciones |

---

# 📁 Organización del proyecto

```text
/
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   ├── api/            # Comunicación con el backend
│   ├── assets/         # Recursos gráficos
│   ├── components/     # Componentes reutilizables
│   ├── constants/      # Constantes globales
│   ├── context/        # Context API
│   ├── data/           # Modelos y datos auxiliares
│   ├── hooks/          # Hooks personalizados
│   ├── pages/          # Pantallas de la aplicación
│   ├── utils/          # Funciones auxiliares
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── firebase.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Instalación

### Clonar el repositorio

```bash
git clone https://github.com/Pino3001/Trego-Web.git
```

Ingresar al proyecto

```bash
cd Trego-Web
```

Instalar dependencias

```bash
npm install
```

Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

Completar las variables correspondientes.

---

# 🔐 Variables de entorno

La aplicación utiliza variables con el prefijo `VITE_`.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=

VITE_API_URL=
```

> **Importante:** Nunca incluir credenciales privadas dentro del repositorio.

---

# ▶️ Ejecución

Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en

```text
http://localhost:5173
```

---

# 📦 Scripts disponibles

| Script | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la versión de producción |
| `npm run preview` | Previsualiza la build generada |
| `npm run lint` | Ejecuta ESLint |

---

# 📸 Capturas de pantalla

## 👤 Clientes

| Inicio | Menú Restaurantes |
|--------|---------------------|
| <img width="634" height="287" alt="Captura desde 2026-07-09 15-28-46" src="https://github.com/user-attachments/assets/a2e35fa7-03fa-49f0-9bb0-aa8ca07b53fe" /> | <img width="634" height="287" alt="Captura desde 2026-07-09 15-31-34" src="https://github.com/user-attachments/assets/bba04bcc-97ae-4b3e-863c-f7b5cac170f9" />
|

---

## 🍽️ Restaurantes

| Inicio | Gestión de Productos |
|----------------------|--------------------|
| <img width="634" height="287" alt="Captura desde 2026-07-09 15-33-23" src="https://github.com/user-attachments/assets/28c4dc14-78da-4229-8592-8fe6b7dd780a" /> | <img width="634" height="287" alt="Captura desde 2026-07-09 15-34-20" src="https://github.com/user-attachments/assets/34648d28-926c-4329-b0f6-6788845c71e5" />|

---

## 🛠️ Administradores

| Inicio | Restaurantes Registrados |
|-------------------------|----------------------|
| <img width="634" height="287" alt="Captura desde 2026-07-09 15-35-58" src="https://github.com/user-attachments/assets/46c7e371-d218-48b1-8758-d86b1daf666b" /> | <img width="634" height="287" alt="image" src="https://github.com/user-attachments/assets/32b78c11-665c-4e8c-9464-d524630fca4b" /> |

---

# 🔗 Servicios utilizados

- Backend REST TREGO
- Firebase Authentication
- Cloudinary
- Geoapify

---

# ✅ Buenas prácticas

- Mantener las credenciales fuera del repositorio.
- Utilizar variables de entorno para la configuración.
- Ejecutar `npm run lint` antes de publicar cambios.
- Generar una build de producción antes del despliegue.
- Mantener la separación entre componentes, lógica de negocio y acceso a datos.

---

# 👨‍💻 Autores

Proyecto desarrollado por el **Grupo 6** como trabajo final de la carrera **Tecnólogo en Informática**.

- Alexis La Cruz
- Ezequiel Medina
- Maikol Brion
- Dámaso Tor
- Horacio Duarte
- Nicolás Fernández
- Cristian González
- Mateo Sparano

---

# 📄 Licencia

Este proyecto fue desarrollado con fines exclusivamente académicos como trabajo final de la carrera **Tecnólogo en Informática**.

No se autoriza su utilización comercial sin el consentimiento expreso de sus autores.
