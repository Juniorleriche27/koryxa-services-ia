"""Enforce cross-organization integrity for finance evidence references.

Revision ID: 20261016_0020
Revises: 20261016_0019

Additive constraints only; existing per-ID foreign keys remain in place.
Before applying to production, run orphan and tenant-mismatch preflight queries.
"""
from alembic import op
import sqlalchemy as sa

revision = "20261016_0020"
down_revision = "20261016_0019"
branch_labels = None
depends_on = None


def upgrade():
    op.create_unique_constraint(
        "uq_finance_cash_accounts_org_id", "finance_cash_accounts", ["organization_id", "id"]
    )
    # Initial migration 0009 creates Expense from current ORM metadata on fresh
    # installations, so the composite uniqueness may already exist there.
    expense_constraints = {c["name"] for c in sa.inspect(op.get_bind()).get_unique_constraints("expenses")}
    if "uq_expenses_org_id" not in expense_constraints:
        op.create_unique_constraint("uq_expenses_org_id", "expenses", ["organization_id", "id"])
    op.create_foreign_key(
        "fk_finance_cash_movement_tenant_account", "finance_cash_movements",
        "finance_cash_accounts", ["organization_id", "account_id"], ["organization_id", "id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_finance_cost_classification_tenant_expense", "finance_cost_classifications",
        "expenses", ["organization_id", "expense_id"], ["organization_id", "id"],
        ondelete="CASCADE",
    )


def downgrade():
    op.drop_constraint("fk_finance_cost_classification_tenant_expense", "finance_cost_classifications", type_="foreignkey")
    op.drop_constraint("fk_finance_cash_movement_tenant_account", "finance_cash_movements", type_="foreignkey")
    op.drop_constraint("uq_expenses_org_id", "expenses", type_="unique")
    op.drop_constraint("uq_finance_cash_accounts_org_id", "finance_cash_accounts", type_="unique")
