"""add stock_quantity, description to products; add name, is_banned to users

Revision ID: 003_stock_and_user_fields
Revises: 002_order_item_snapshots
Create Date: 2026-05-14

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "003_stock_and_user_fields"
down_revision: str | None = "002_order_item_snapshots"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("stock_quantity", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("name", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("is_banned", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("products", "description")
    op.drop_column("products", "stock_quantity")
    op.drop_column("users", "name")
    op.drop_column("users", "is_banned")
