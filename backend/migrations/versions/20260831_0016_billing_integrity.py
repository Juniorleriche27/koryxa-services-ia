"""Enforce billing transaction ownership and payment uniqueness.

Revision ID: 20260831_0016
Revises: 20260831_0015
"""

from __future__ import annotations

from alembic import op

revision = "20260831_0016"
down_revision = "20260831_0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_foreign_key(
        "fk_billing_transactions_organization",
        "billing_transactions",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "uq_billing_transactions_payment_id",
        "billing_transactions",
        ["koryxa_payment_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_billing_transactions_payment_id", table_name="billing_transactions")
    op.drop_constraint(
        "fk_billing_transactions_organization", "billing_transactions", type_="foreignkey"
    )
