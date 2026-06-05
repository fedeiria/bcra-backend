# BCRA Dashboard - Backend API ⚙️

Middleware desarrollado con **NestJS** para actuar como puente con las APIs oficiales del Banco Central de la República Argentina (BCRA). Centraliza la lógica de negocio, el formateo de datos y expone endpoints limpios para el Frontend.

---

## 🚀 Características y Módulos

El proyecto está completamente modularizado para mantener una arquitectura escalable:

*   **📈 `api/monetary`**: Consulta y procesamiento del catálogo de variables monetarias del BCRA.
*   **💱 `api/exchange`**: Estadísticas cambiarias y evolución histórica de divisas.
*   **📋 `api/checks`**: Módulo para la gestión y verificación de cheques.
*   **💳 `api/debts`**: Central de deudores y procesamiento de información financiera.
*   **⏱️ `api/status`**: Endpoint dedicado al monitoreo de salud (*health check*) y *keep-alive*.

---

## 🛠️ Stack Tecnológico

| Herramienta | Uso |
| :--- | :--- |
| **NestJS 11** | Framework de Node.js progresivo y tipado fuerte. |
| **TypeScript** | Lenguaje principal de desarrollo. |
| **@nestjs/config** | Manejo de variables de entorno globales. |
| **Axios / HttpModule** | Conexión e intercambio de datos con la API del BCRA. |

---

## ⚙️ Configuración Global y Endpoints

Para unificar la API y proteger el ruteo, el servidor aplica un prefijo global en el arranque (`main.ts`):

```typescript
app.setGlobalPrefix('api');

git clone [https://github.com/fedeiria/bcra-backend.git]


2.  **Instalar dependencias:**
bash
    npm install

3.  **Ejecutar en modo desarrollo (Watch mode):**
bash
    npm run start:dev

🚀 El servidor local arrancará en `http://localhost:3000/api/`.

---

## ☁️ Infraestructura en Producción (Render Free Tier)

Para evitar la suspensión automática tras 15 minutos de inactividad típica de las cuentas gratuitas de Render, el proyecto cuenta con una estrategia de auto-despertador (*Keep-Alive*):

### 1. Endpoint de Monitoreo
Se implementó el endpoint ultra-liviano `GET /api/status/ping` que responde de manera inmediata sin sobrecargar el servidor ni realizar consultas externas:

json
{
  "status": "online",
  "timestamp": "2026-06-01T15:51:50.616Z"
}
```