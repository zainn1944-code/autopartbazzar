"""add payment_method, payment_ref to orders

Revision ID: 008_order_payment_fields
Revises: 007_saved_builds
Create Date: 2026-06-08

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "008_order_payment_fields"
down_revision: str | None = "007_saved_builds"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("payment_method", sa.String(32), nullable=False, server_default="COD"),
    )
    op.add_column("orders", sa.Column("payment_ref", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "payment_ref")
    op.drop_column("orders", "payment_method")
