"""Add whatsapp_authorized_senders table and connection mode fields.

Revision ID: 20260827_0013
Revises: 20260827_0012
"""

import sqlalchemy as sa
from alembic import op

revision = "20260827_0013"
down_revision = "20260827_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add connection mode and metadata columns to organization_integration_configs
    with op.batch_alter_table("organization_integration_configs", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("whatsapp_connection_mode", sa.String(length=30), nullable=False, server_default="meta_api")
        )
        batch_op.add_column(
            sa.Column("whatsapp_business_account_id", sa.String(length=120), nullable=True)
        )
        batch_op.add_column(
            sa.Column("whatsapp_api_version", sa.String(length=20), nullable=False, server_default="v21.0")
        )
        batch_op.add_column(
            sa.Column("whatsapp_unauthorized_reply", sa.Text(), nullable=True)
        )

    # 2. Create whatsapp_authorized_senders table
    op.create_table(
        "whatsapp_authorized_senders",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("organization_id", sa.String(length=36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("phone_number", sa.String(length=32), nullable=False, index=True),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_by_user_id", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "phone_number", name="uq_org_authorized_phone"),
    )


def downgrade() -> None:
    op.drop_table("whatsapp_authorized_senders")
    with op.batch_alter_table("organization_integration_configs", schema=None) as batch_op:
        batch_op.drop_column("whatsapp_unauthorized_reply")
        batch_op.drop_column("whatsapp_api_version")
        batch_op.drop_column("whatsapp_business_account_id")
        batch_op.drop_column("whatsapp_connection_mode")
