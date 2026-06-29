"""add idempotency_key to orders

Revision ID: 009_order_idempotency_key
Revises: 008_order_payment_fields
Create Date: 2026-06-08

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "009_order_idempotency_key"
down_revision: str | None = "008_order_payment_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("idempotency_key", sa.String(64), nullable=True))
    op.create_index(
        "ix_orders_idempotency_key", "orders", ["idempotency_key"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_orders_idempotency_key", table_name="orders")
    op.drop_column("orders", "idempotency_key")
