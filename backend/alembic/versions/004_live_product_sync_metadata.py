"""add live product sync metadata

Revision ID: 004_live_product_sync_metadata
Revises: 003_stock_and_user_fields
Create Date: 2026-05-15

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "004_live_product_sync_metadata"
down_revision: str | None = "003_stock_and_user_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("source_name", sa.String(length=255), nullable=True))
    op.add_column("products", sa.Column("source_url", sa.Text(), nullable=True))
    op.add_column("products", sa.Column("external_id", sa.String(length=255), nullable=True))
    op.add_column(
        "products",
        sa.Column("is_live_listing", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column("products", sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_products_external_id"), "products", ["external_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_external_id"), table_name="products")
    op.drop_column("products", "last_synced_at")
    op.drop_column("products", "is_live_listing")
    op.drop_column("products", "external_id")
    op.drop_column("products", "source_url")
    op.drop_column("products", "source_name")
