from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from routers import auth, car_models, orders, password_reset, products, reviews, users
from services.mock_fetcher import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    start_scheduler()
    yield
    # Shutdown actions

settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app = FastAPI(title="AutoPart Bazaar API", version="1.0.0", lifespan=lifespan)
static_dir = Path(__file__).resolve().parent / "static"
static_dir.mkdir(exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=static_dir), name="media")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(car_models.router)
app.include_router(password_reset.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
