"""Financial evidence tables, additive only.

Revision ID: 20261013_0018
Revises: 20260920_0017
"""
from alembic import op
import sqlalchemy as sa

revision = "20261013_0018"
down_revision = "20260920_0017"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "finance_cash_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("opening_balance", sa.Numeric(18, 2), nullable=True),
        sa.Column("opening_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_by_user_id", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "name", name="uq_finance_cash_account_name_per_org"),
    )
    op.create_index("ix_finance_cash_accounts_organization_id", "finance_cash_accounts", ["organization_id"])
    op.create_table(
        "finance_cash_movements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", sa.String(36), sa.ForeignKey("finance_cash_accounts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("direction", sa.String(8), nullable=False),
        sa.Column("category", sa.String(40), nullable=False),
        sa.Column("source_kind", sa.String(40), nullable=True),
        sa.Column("source_id", sa.String(36), nullable=True),
        sa.Column("transfer_group_id", sa.String(36), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_by_user_id", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "source_kind", "source_id", "direction", name="uq_finance_cash_movement_source"),
        sa.CheckConstraint("amount > 0", name="ck_finance_cash_movement_amount_positive"),
        sa.CheckConstraint("direction IN ('in', 'out')", name="ck_finance_cash_movement_direction"),
    )
    op.create_index("ix_finance_cash_movements_organization_id", "finance_cash_movements", ["organization_id"])
    op.create_index("ix_finance_cash_movements_account_id", "finance_cash_movements", ["account_id"])
    op.create_table(
        "finance_cost_classifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expense_id", sa.String(36), sa.ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("behavior", sa.String(16), nullable=False),
        sa.Column("relation", sa.String(16), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("updated_by_user_id", sa.String(120), nullable=True),
        sa.UniqueConstraint("organization_id", "expense_id", name="uq_finance_classification_expense"),
        sa.CheckConstraint("behavior IN ('fixed', 'variable', 'unknown')", name="ck_finance_cost_behavior"),
        sa.CheckConstraint("relation IN ('direct', 'indirect', 'unknown')", name="ck_finance_cost_relation"),
    )
    op.create_index("ix_finance_cost_classifications_organization_id", "finance_cost_classifications", ["organization_id"])
    op.create_index("ix_finance_cost_classifications_expense_id", "finance_cost_classifications", ["expense_id"])


def downgrade():
    op.drop_table("finance_cost_classifications")
    op.drop_table("finance_cash_movements")
    op.drop_table("finance_cash_accounts")
