"""add signup_otps table for OTP-verified registration

Revision ID: 010_signup_otps_table
Revises: 009_order_idempotency_key
Create Date: 2026-06-10

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "010_signup_otps_table"
down_revision: str | None = "009_order_idempotency_key"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "signup_otps",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(64), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("otp_hash", sa.Text(), nullable=False),
        sa.Column("expiry_ms", sa.BigInteger(), nullable=False),
    )
    op.create_index("ix_signup_otps_email", "signup_otps", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_signup_otps_email", table_name="signup_otps")
    op.drop_table("signup_otps")
