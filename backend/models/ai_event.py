from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class AIRecommendationEvent(Base):
    __tablename__ = "ai_recommendation_events"
    __table_args__ = (
        Index("ix_ai_events_recommendation_id", "recommendation_id"),
        Index("ix_ai_events_product_event", "product_id", "event"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    recommendation_id: Mapped[str] = mapped_column(String(64), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    product_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    event: Mapped[str] = mapped_column(String(32), nullable=False)
    car_make: Mapped[str | None] = mapped_column(String(64), nullable=True)
    car_model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    build_style: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
