"""Add billing and subscription support.

Revision ID: 20260831_0015
Revises: 20260827_0014
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260831_0015"
down_revision = "20260827_0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("organizations", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "subscription_plan", sa.String(length=40), server_default="trial", nullable=False
            )
        )
        batch_op.add_column(
            sa.Column(
                "subscription_status", sa.String(length=40), server_default="trial", nullable=False
            )
        )
        batch_op.add_column(
            sa.Column(
                "subscription_period_months", sa.Integer(), server_default="3", nullable=False
            )
        )
        batch_op.add_column(
            sa.Column("subscription_ends_at", sa.DateTime(timezone=True), nullable=True)
        )
        batch_op.add_column(
            sa.Column("max_authorized_senders", sa.Integer(), server_default="3", nullable=False)
        )

    op.create_table(
        "billing_transactions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("product_code", sa.String(length=80), nullable=False),
        sa.Column("plan", sa.String(length=40), nullable=False),
        sa.Column("period_months", sa.Integer(), server_default="3", nullable=False),
        sa.Column("amount_minor", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(length=10), server_default="XOF", nullable=False),
        sa.Column("provider", sa.String(length=40), server_default="leekpay", nullable=False),
        sa.Column("status", sa.String(length=40), server_default="pending", nullable=False),
        sa.Column("koryxa_payment_id", sa.String(length=120), nullable=True),
        sa.Column("checkout_url", sa.String(length=500), nullable=True),
        sa.Column("idempotency_key", sa.String(length=120), nullable=False),
        sa.Column("customer_phone", sa.String(length=40), nullable=True),
        sa.Column("customer_email", sa.String(length=180), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_billing_transactions_org_id", "billing_transactions", ["organization_id"])
    op.create_index(
        "ix_billing_transactions_idempotency_key",
        "billing_transactions",
        ["idempotency_key"],
        unique=True,
    )
    op.create_index("ix_billing_transactions_status", "billing_transactions", ["status"])


def downgrade() -> None:
    op.drop_table("billing_transactions")
    with op.batch_alter_table("organizations", schema=None) as batch_op:
        batch_op.drop_column("max_authorized_senders")
        batch_op.drop_column("subscription_ends_at")
        batch_op.drop_column("subscription_period_months")
        batch_op.drop_column("subscription_status")
        batch_op.drop_column("subscription_plan")
