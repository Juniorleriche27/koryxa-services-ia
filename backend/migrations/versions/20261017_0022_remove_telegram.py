"""Remove the discontinued Telegram integration.

Revision ID: 20261017_0022
Revises: 20261016_0021
"""

import sqlalchemy as sa
from alembic import op

revision = "20261017_0022"
down_revision = "20261016_0021"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("telegram_webhook_events")
    op.drop_table("telegram_authorized_users")
    op.drop_index(
        "ix_org_integration_telegram_link_code",
        table_name="organization_integration_configs",
    )
    op.drop_column("organization_integration_configs", "telegram_webhook_enabled")
    op.drop_column("organization_integration_configs", "telegram_active")
    op.drop_column("organization_integration_configs", "telegram_link_code")
    op.drop_column("organization_integration_configs", "telegram_bot_username")
    op.drop_column("organization_integration_configs", "telegram_bot_token_encrypted")


def downgrade():
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
        sa.Column("telegram_active", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_webhook_enabled", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.create_index(
        "ix_org_integration_telegram_link_code",
        "organization_integration_configs",
        ["telegram_link_code"],
        unique=True,
    )
    op.create_table(
        "telegram_authorized_users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "organization_id",
            sa.String(length=36),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("telegram_user_id", sa.String(length=64), nullable=False),
        sa.Column("telegram_username", sa.String(length=120), nullable=True),
        sa.Column("first_name", sa.String(length=120), nullable=True),
        sa.Column("last_name", sa.String(length=120), nullable=True),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "telegram_user_id", name="uq_org_telegram_user"),
    )
    op.create_index("ix_telegram_users_org_id", "telegram_authorized_users", ["organization_id"])
    op.create_index("ix_telegram_users_user_id", "telegram_authorized_users", ["telegram_user_id"])
    op.create_table(
        "telegram_webhook_events",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "integration_config_id",
            sa.String(length=36),
            sa.ForeignKey("organization_integration_configs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "organization_id",
            sa.String(length=36),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("update_id", sa.BigInteger(), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("integration_config_id", "update_id", name="uq_telegram_webhook_update"),
    )
    op.create_index(
        "ix_telegram_webhook_events_integration_config_id",
        "telegram_webhook_events",
        ["integration_config_id"],
    )
    op.create_index(
        "ix_telegram_webhook_events_organization_id",
        "telegram_webhook_events",
        ["organization_id"],
    )
