# Auto Part Bazaar

Auto Part Bazaar is a full-stack auto-parts marketplace with AI-powered car customization, 3D model visualization, and integrated payment flow.

## Active Application

- `frontend/` — React + Vite frontend
- `backend/` — FastAPI + SQLAlchemy backend
- `scripts/` — local setup and seed helpers

## Features

- User signup and login with JWT-based auth and OTP email verification
- Product listing, detail pages, cart, and checkout
- 3D car garage and model viewer (Honda Civic, Toyota Corolla, Toyota Hilux)
- AI car modification panel — recommend parts and customize cars visually
- Saved car builds per user (up to 25 per account)
- JazzCash payment integration with mock payment fallback
- Admin dashboard: product management, order management, user management
- Bulk product upload (CSV)
- Seed scripts for cars and products

## Tech Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, Three.js
- **Backend:** FastAPI, SQLAlchemy async, PostgreSQL, Alembic
- **Auth:** JWT + OTP (email)
- **Payments:** JazzCash (+ mock payment for local dev)
- **3D models:** GLB assets served from `frontend/public`

## Project Structure

```text
zainproject/
├── backend/
│   ├── alembic/versions/     # DB migrations (001-011)
│   ├── models/               # SQLAlchemy models
│   ├── routers/              # FastAPI route handlers
│   ├── schemas/              # Pydantic schemas
│   └── services/             # Business logic
├── frontend/
│   ├── public/models/        # GLB 3D car models
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       └── pages/
├── scripts/                  # Seed helpers
└── README.md
```

## Quick Start

Run from the project root:

```powershell
npm.cmd run setup
```

This will:

- create `backend/autopart_venv` if needed
- install backend and frontend dependencies
- create `backend/.env` from `backend/.env.example` if missing

Then set `DATABASE_URL` in `backend/.env` and run migrations:

```powershell
npm.cmd run migrate:backend
```

## Run the App

```powershell
npm.cmd run dev:backend    # FastAPI on http://127.0.0.1:8000
npm.cmd run dev:frontend   # Vite on http://localhost:5173
```

## Manual Setup

```powershell
python -m venv backend\autopart_venv
backend\autopart_venv\Scripts\python.exe -m pip install --upgrade pip
backend\autopart_venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
npm.cmd --prefix frontend install
```

Apply migrations after `backend/.env` points at PostgreSQL:

```powershell
Set-Location backend
.\autopart_venv\Scripts\python.exe -m alembic upgrade head
Set-Location ..
```

Manual run commands:

```powershell
cd backend && .\autopart_venv\Scripts\python.exe -m uvicorn main:app --reload
cd frontend && npm.cmd run dev
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing key |
| `FRONTEND_BASE_URL` | Yes | Used for payment redirects |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_BUCKET_NAME` | No | S3 image uploads (falls back to local `/media`) |
| `EMAIL_USER` / `EMAIL_PASS` | No | SMTP for OTP emails (returns 503 if unset) |
| `JAZZCASH_MERCHANT_ID` / `JAZZCASH_PASSWORD` / `JAZZCASH_INTEGRITY_SALT` | No | JazzCash payments (mock flow works without these) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

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

- The frontend talks directly to `VITE_API_URL` — no Vite `/api` proxy.
- GLB assets are served from `frontend/public/models/`
- Mock payment (`/payments/mock-complete`) is available for local dev without real JazzCash credentials.
- If PowerShell blocks `npm`, use `npm.cmd`.
