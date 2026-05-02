# AutoPart Bazaar

AutoPart Bazaar is a full-stack auto-parts marketplace and car-visualization project.

The active app in this repository is:

- `frontend/`: React + Vite frontend
- `backend/`: FastAPI + SQLAlchemy backend
- `scripts/`: local setup and seed helpers

The old duplicate Next.js app has been removed. The Vite frontend and FastAPI backend are the only active runtime targets.

## Features

- User signup and login with JWT-based auth
- Product listing and product detail pages
- Cart and checkout flow
- 3D car garage/model viewer using GLB assets
- Admin product management endpoints
- Seed scripts for cars and products

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Three.js
- Backend: FastAPI, SQLAlchemy async, PostgreSQL
- Auth: JWT
- 3D models: GLB assets served from `frontend/public`

## Project Structure

```text
zainproject/
|-- backend/
|-- frontend/
|-- scripts/
|-- package.json
`-- README.md
```

## Quick Start

Run this from the project root:

```powershell
npm.cmd run setup
```

This will:

- create `backend/autopart_venv` if needed
- install backend dependencies
- install frontend dependencies
- create `backend/.env` from `backend/.env.example` if missing

Before starting the app, do these required backend steps:

1. Set `DATABASE_URL` in `backend/.env` to a running PostgreSQL database.
2. Run Alembic migrations:

```powershell
npm.cmd run migrate:backend
```

Optional local-dev services:

- Leave `AWS_*` blank to store uploaded product images locally under the backend `media` route.
- Set `EMAIL_USER` / `EMAIL_PASS` if you want password-reset OTP emails to work.

## Run the App

Start the backend:

```powershell
npm.cmd run dev:backend
```

Start the frontend:

```powershell
npm.cmd run dev:frontend
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

## Manual Setup

If you want to do setup manually:

```powershell
python -m venv backend\autopart_venv
backend\autopart_venv\Scripts\python.exe -m pip install --upgrade pip
backend\autopart_venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
npm.cmd --prefix frontend install
```

Apply database migrations after `backend/.env` points at PostgreSQL:

```powershell
Set-Location backend
.\autopart_venv\Scripts\python.exe -m alembic upgrade head
Set-Location ..
```

Manual run commands:

```powershell
cd backend
.\autopart_venv\Scripts\python.exe -m uvicorn main:app --reload
```

```powershell
cd frontend
npm.cmd run dev
```

## Environment

Update `backend/.env` before using the app with real services.

Main backend settings include:

- `database_url`
- `secret_key`
- `aws_region`
- `aws_access_key_id`
- `aws_secret_access_key`
- `aws_bucket_name`
- `email_user`
- `email_pass`
- `cors_origins`

Behavior when optional services are not configured:

- Product image uploads fall back to local storage served from `http://127.0.0.1:8000/media/...`
- Password reset email endpoints return a clear `503` until SMTP credentials are configured

## Useful Scripts

Root scripts from `package.json`:

- `npm.cmd run setup`
- `npm.cmd run install:frontend`
- `npm.cmd run install:backend`
- `npm.cmd run migrate:backend`
- `npm.cmd run dev:frontend`
- `npm.cmd run dev:backend`

Seed helpers:

- `scripts/seed_car_models.py`
- `scripts/seed_products.py`

## Notes

- The frontend talks directly to `VITE_API_URL` and does not rely on a Vite `/api` proxy.
- GLB assets are served from `frontend/public/carmodels/` and `frontend/public/models/`
- If PowerShell blocks `npm`, use `npm.cmd`
