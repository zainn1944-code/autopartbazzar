"""add name column to signup_otps

Revision ID: 011_signup_otp_name
Revises: 010_signup_otps_table
Create Date: 2026-06-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "011_signup_otp_name"
down_revision: str | None = "010_signup_otps_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("signup_otps", sa.Column("name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("signup_otps", "name")
