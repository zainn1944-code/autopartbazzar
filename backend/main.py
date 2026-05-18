from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from config import get_settings
from routers import admin_sync, auth, car_ai, car_models, orders, password_reset, products, reviews, users, wishlists
from services.parts_sync import start_scheduler, stop_scheduler

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

# Allow all localhost ports for local development
_localhost_origins = [f"http://localhost:{p}" for p in range(5170, 5180)] + \
                     [f"http://127.0.0.1:{p}" for p in range(5170, 5180)]
origins = list(set(origins + _localhost_origins))

app = FastAPI(
    title="AutoPart Bazaar API",
    version="1.0.0",
    lifespan=lifespan,
    description="Industry-grade auto-parts marketplace API with JWT auth, rate limiting, and 3D car configurator.",
)

# ── Rate limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ──────────────────────────────────────────────────────────────
static_dir = Path(__file__).resolve().parent / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=static_dir), name="media")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(car_ai.router)
app.include_router(admin_sync.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(car_models.router)
app.include_router(password_reset.router)
app.include_router(wishlists.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}
