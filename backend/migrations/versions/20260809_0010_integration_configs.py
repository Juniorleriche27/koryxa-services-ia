"""Persist encrypted AI and WhatsApp integration settings.

Revision ID: 20260809_0010
Revises: 20260802_0009
"""

import sqlalchemy as sa
from alembic import op

revision = "20260809_0010"
down_revision = "20260802_0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organization_integration_configs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ai_provider", sa.String(30), nullable=False, server_default="knowlia"),
        sa.Column("ai_model_name", sa.String(120), nullable=False, server_default="llama3.2:3b"),
        sa.Column("ai_temperature", sa.Float(), nullable=False, server_default="0.3"),
        sa.Column("ai_custom_system_prompt", sa.Text()),
        sa.Column("knowlia_assistant_id", sa.String(100)),
        sa.Column("ai_api_key_encrypted", sa.Text()),
        sa.Column("whatsapp_phone_number_id", sa.String(120)),
        sa.Column("whatsapp_verify_token_encrypted", sa.Text()),
        sa.Column("whatsapp_app_secret_encrypted", sa.Text()),
        sa.Column("whatsapp_access_token_encrypted", sa.Text()),
        sa.Column("whatsapp_authorized_senders", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("whatsapp_active", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("whatsapp_auto_reply", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("whatsapp_phone_number_id"),
    )
    op.create_index(
        "ix_organization_integration_configs_organization_id",
        "organization_integration_configs",
        ["organization_id"],
        unique=True,
    )
    op.create_table(
        "whatsapp_webhook_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("message_id", sa.String(180), nullable=False),
        sa.Column(
            "received_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.UniqueConstraint("message_id", name="uq_whatsapp_webhook_message_id"),
    )
    op.create_index(
        "ix_whatsapp_webhook_events_organization_id",
        "whatsapp_webhook_events",
        ["organization_id"],
    )


def downgrade() -> None:
    op.drop_table("whatsapp_webhook_events")
    op.drop_table("organization_integration_configs")
