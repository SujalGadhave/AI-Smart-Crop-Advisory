# Render Deployment (Totally Free) - Step by Step

This guide deploys your project on Render using only free resources:

- 1 free static site (frontend)
- 2 free web services (backend + AI)
- 1 free Render Postgres database

## Important free-tier limits (Render)

- Free web services spin down after 15 minutes of inactivity.
- Free Postgres expires after 30 days unless upgraded.
- Only one free Postgres database is allowed per workspace.

## 1. Push code to GitHub

Make sure your latest code is in your GitHub repository. This repo already includes a ready `render.yaml` blueprint.

## 2. Create Render account

1. Open `https://render.com`.
2. Sign in with GitHub.
3. Create a Hobby workspace (free).

## 3. Create all services with Blueprint

1. In Render dashboard, click **New** -> **Blueprint**.
2. Select your repository.
3. Render detects `render.yaml`.
4. Click **Apply**.

This creates:

- `krushimitra-ai` (free web service)
- `krushimitra-backend` (free web service)
- `krushimitra-frontend` (free static site)
- `krushimitra-db` (free Postgres)

## 4. Fill the prompted environment variables

During initial blueprint creation, Render prompts for variables marked `sync: false`.

Set them like this:

### For backend service (`krushimitra-backend`)

- `AI_SERVICE_URL` = `https://krushimitra-ai.onrender.com/predict`
- `CORS_ALLOWED_ORIGIN_PATTERNS` = `https://krushimitra-frontend.onrender.com,http://localhost:*`

### For frontend service (`krushimitra-frontend`)

- `VITE_API_BASE_URL` = `https://krushimitra-backend.onrender.com`

If Render adds a suffix to service names, use the exact generated `.onrender.com` URLs from your dashboard.

## 5. Wait for first deploy

First deploy can take a few minutes.

Check health:

- Backend: `https://<backend-service>.onrender.com/actuator/health`
- AI: `https://<ai-service>.onrender.com/health`
- Frontend: `https://<frontend-service>.onrender.com`

## 6. Verify app flow

1. Open frontend URL.
2. Register/Login.
3. Try advisory/weather/market endpoints from UI.
4. Try disease detection upload.

## 7. If backend cannot connect to database

Open backend service -> **Environment** and verify:

- `DATABASE_URL` is auto-filled from Render Postgres
- `SPRING_DATASOURCE_USERNAME` is auto-filled
- `SPRING_DATASOURCE_PASSWORD` is auto-filled
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver`

The backend Docker image auto-converts Render's Postgres URL to a JDBC URL at startup.

## 8. Redeploy after code changes

Push to your connected branch on GitHub.
Render auto-deploys all services according to `render.yaml`.

## 9. Cost reminder

This setup is free under Render free limits, but:

- services can sleep on idle,
- free usage quotas still apply,
- free Postgres is temporary (30 days).