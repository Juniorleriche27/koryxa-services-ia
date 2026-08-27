"""Add whatsapp_lid to whatsapp_authorized_senders table.

Revision ID: 20260827_0014
Revises: 20260827_0013
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "20260827_0014"
down_revision = "20260827_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("whatsapp_authorized_senders", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("whatsapp_lid", sa.String(length=64), nullable=True)
        )
        batch_op.create_index("ix_whatsapp_authorized_senders_whatsapp_lid", ["whatsapp_lid"])


def downgrade() -> None:
    with op.batch_alter_table("whatsapp_authorized_senders", schema=None) as batch_op:
        batch_op.drop_index("ix_whatsapp_authorized_senders_whatsapp_lid")
        batch_op.drop_column("whatsapp_lid")
