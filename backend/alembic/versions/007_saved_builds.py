"""create saved_builds table

Revision ID: 007_saved_builds
Revises: 006_ai_recommendation_events
Create Date: 2026-05-29

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "007_saved_builds"
down_revision: str | None = "006_ai_recommendation_events"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "saved_builds",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("car_make", sa.String(length=64), nullable=False),
        sa.Column("car_model", sa.String(length=64), nullable=False),
        sa.Column("car_year", sa.Integer(), nullable=True),
        sa.Column("model_url", sa.String(length=512), nullable=True),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_builds_user_id", "saved_builds", ["user_id"])
    op.create_index("ix_saved_builds_user_updated", "saved_builds", ["user_id", "updated_at"])


def downgrade() -> None:
    op.drop_index("ix_saved_builds_user_updated", table_name="saved_builds")
    op.drop_index("ix_saved_builds_user_id", table_name="saved_builds")
    op.drop_table("saved_builds")
