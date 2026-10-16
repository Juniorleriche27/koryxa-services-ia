"""Telegram per-bot webhook safety, idempotent replay ledger.

Revision ID: 20261016_0019
Revises: 20261013_0018
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20261016_0019"
down_revision = "20261013_0018"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "organization_integration_configs",
        sa.Column("telegram_webhook_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "telegram_webhook_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("integration_config_id", sa.String(36), sa.ForeignKey("organization_integration_configs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("update_id", sa.BigInteger(), nullable=False),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("integration_config_id", "update_id", name="uq_telegram_webhook_update"),
    )
    op.create_index("ix_telegram_webhook_events_integration_config_id", "telegram_webhook_events", ["integration_config_id"])
    op.create_index("ix_telegram_webhook_events_organization_id", "telegram_webhook_events", ["organization_id"])


def downgrade():
    op.drop_table("telegram_webhook_events")
    op.drop_column("organization_integration_configs", "telegram_webhook_enabled")
