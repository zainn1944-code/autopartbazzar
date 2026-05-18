"""allow order item snapshots

Revision ID: 002_order_item_snapshots
Revises: 001_initial
Create Date: 2026-05-09

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002_order_item_snapshots"
down_revision: str | None = "001_initial"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("order_items", "product_id", existing_type=sa.Integer(), nullable=True)
    op.add_column("order_items", sa.Column("snapshot", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("order_items", "snapshot")
    op.alter_column("order_items", "product_id", existing_type=sa.Integer(), nullable=False)
