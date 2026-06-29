"""create ai_recommendation_events table

Revision ID: 006_ai_recommendation_events
Revises: 005_wishlists_table
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "006_ai_recommendation_events"
down_revision: str | None = "005_wishlists_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ai_recommendation_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("recommendation_id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("product_id", sa.String(length=64), nullable=True),
        sa.Column("event", sa.String(length=32), nullable=False),
        sa.Column("car_make", sa.String(length=64), nullable=True),
        sa.Column("car_model", sa.String(length=64), nullable=True),
        sa.Column("build_style", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_events_recommendation_id",
        "ai_recommendation_events",
        ["recommendation_id"],
    )
    op.create_index(
        "ix_ai_events_product_event",
        "ai_recommendation_events",
        ["product_id", "event"],
    )


def downgrade() -> None:
    op.drop_index("ix_ai_events_product_event", table_name="ai_recommendation_events")
    op.drop_index("ix_ai_events_recommendation_id", table_name="ai_recommendation_events")
    op.drop_table("ai_recommendation_events")
