# Client Bot Futuros (PWA)

Panel de control instalable: el usuario ingresa su email, se verifica en DynamoDB vía la API y, si `pagoValido = TRUE`, puede activar el bot.

## Requisitos

- Backend `bot-futuros` en ejecución (`npm run dev`, puerto 3000 por defecto)
- Usuario registrado con pago activo (admin: `PATCH /api/v1/users/:uid/payment`)

## Desarrollo

```bash
cd client-bot-futuros
npm install
npm run dev
```

Abre `http://localhost:5173`. Las peticiones a `/api` se redirigen al backend (proxy en `vite.config.ts`).

## Producción

```bash
cp .env.example .env
# VITE_API_URL=https://tu-api.railway.app

npm run build
npm run preview
```

Sirve la carpeta `dist/` en cualquier host estático (Netlify, Vercel, Cloudflare Pages, etc.).

## Flujo

1. **Verificar cuenta** → `POST /api/v1/users/lookup` con `{ "email": "..." }`
2. Si `pagoValido === "TRUE"` y hay API keys → botón **Activar bot** habilitado
3. **Activar** → `POST /api/v1/users/:uid/toggle-bot` con `{ "active": true }`

La sesión (email + uid) se guarda en `localStorage` para revalidar al volver.

## Instalar como PWA

En Chrome/Edge: menú → *Instalar aplicación*. En móvil: *Añadir a pantalla de inicio*.
