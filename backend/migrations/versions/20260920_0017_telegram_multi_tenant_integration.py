"""Add Telegram integration fields and authorized users table.

Revision ID: 20260920_0017
Revises: 20260831_0016
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260920_0017"
down_revision = "20260831_0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add Telegram columns to organization_integration_configs
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_bot_token_encrypted", sa.Text(), nullable=True),
    )
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_bot_username", sa.String(length=120), nullable=True),
    )
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_link_code", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index(
        "ix_org_integration_telegram_link_code",
        "organization_integration_configs",
        ["telegram_link_code"],
        unique=True,
    )

    # 2. Create telegram_authorized_users table
    op.create_table(
        "telegram_authorized_users",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("telegram_user_id", sa.String(length=64), nullable=False),
        sa.Column("telegram_username", sa.String(length=120), nullable=True),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_telegram_users_org",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("organization_id", "telegram_user_id", name="uq_org_telegram_user"),
    )
    op.create_index(
        "ix_telegram_users_org_id",
        "telegram_authorized_users",
        ["organization_id"],
    )
    op.create_index(
        "ix_telegram_users_user_id",
        "telegram_authorized_users",
        ["telegram_user_id"],
    )


def downgrade() -> None:
    op.drop_table("telegram_authorized_users")
    op.drop_index(
        "ix_org_integration_telegram_link_code",
        table_name="organization_integration_configs",
    )
    op.drop_column("organization_integration_configs", "telegram_active")
    op.drop_column("organization_integration_configs", "telegram_link_code")
    op.drop_column("organization_integration_configs", "telegram_bot_username")
    op.drop_column("organization_integration_configs", "telegram_bot_token_encrypted")
