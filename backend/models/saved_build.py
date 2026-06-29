from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class SavedBuild(Base):
    __tablename__ = "saved_builds"
    __table_args__ = (
        Index("ix_saved_builds_user_updated", "user_id", "updated_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    car_make: Mapped[str] = mapped_column(String(64), nullable=False)
    car_model: Mapped[str] = mapped_column(String(64), nullable=False)
    car_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    model_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Full visual configuration: color, finish, suspension, tint, mods, rim color,
    # caliper color, wheel size, carbon accents, underglow, etc. Schema is owned
    # by the frontend; backend just persists & returns it intact.
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
