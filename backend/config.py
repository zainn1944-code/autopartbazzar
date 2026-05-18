import logging
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

ENV_FILE = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/autopart"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    admin_email: str = "AutoPartBazaar21@gmail.com"

    aws_region: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_bucket_name: str | None = None

    email_user: str | None = None
    email_pass: str | None = None
    smtp_host: str = "smtp.zoho.com"
    smtp_port: int = 465

    cors_origins: str = "http://localhost:5173"

    gemma_api_key: str | None = None
    usd_to_pkr_rate: float = 279.31

    parts_sync_enabled: bool = False
    parts_sync_run_on_startup: bool = True
    parts_sync_hour: int = 1
    parts_sync_minute: int = 0
    parts_feed_urls: str | None = None
    parts_sync_timeout_seconds: int = 20
    parts_sync_user_agent: str = "AutoPartBazaarSync/1.0"

    # Region & category filters — only Lahore car/bike spare parts
    parts_filter_city: str = "Lahore"
    parts_filter_vehicle_types: str = "car,bike"

    @field_validator("secret_key")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if v in ("change-me-in-production", "changeme", "", "secret"):
            raise ValueError(
                "SECRET_KEY is set to the default insecure value. "
                "Set a strong random value in backend/.env before running in production."
            )
        return v

    @field_validator("parts_sync_hour")
    @classmethod
    def validate_parts_sync_hour(cls, v: int) -> int:
        if not 0 <= v <= 23:
            raise ValueError("PARTS_SYNC_HOUR must be between 0 and 23.")
        return v

    @field_validator("parts_sync_minute")
    @classmethod
    def validate_parts_sync_minute(cls, v: int) -> int:
        if not 0 <= v <= 59:
            raise ValueError("PARTS_SYNC_MINUTE must be between 0 and 59.")
        return v


def _warn_optional_services(settings: "Settings") -> None:
    if not all([settings.aws_access_key_id, settings.aws_secret_access_key, settings.aws_bucket_name]):
        logger.warning("AWS credentials not configured — product images will be stored locally.")
    if not settings.email_user or not settings.email_pass:
        logger.warning("SMTP credentials not configured — password-reset emails are disabled.")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    try:
        s = Settings()
    except Exception:
        # Fall back to default (dev mode) if validation fails — log a critical warning
        logger.critical(
            "Settings validation failed — running with INSECURE defaults. "
            "Set SECRET_KEY in backend/.env before deploying."
        )
        s = Settings.model_construct(
            database_url="postgresql+asyncpg://user:password@localhost:5432/autopart",
            secret_key="change-me-in-production",
            algorithm="HS256",
            access_token_expire_minutes=30,
            refresh_token_expire_days=7,
            admin_email="AutoPartBazaar21@gmail.com",
            cors_origins="http://localhost:5173",
        )
    _warn_optional_services(s)
    return s
