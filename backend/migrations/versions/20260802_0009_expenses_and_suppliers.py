"""Add expenses and suppliers register tables.

Revision ID: 20260802_0009
Revises: 20260802_0008
"""

from alembic import op

from app.models.registers import Expense, Supplier

revision = "20260802_0009"
down_revision = "20260802_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    for table in [
        Expense.__table__,
        Supplier.__table__,
    ]:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in [
        Supplier.__table__,
        Expense.__table__,
    ]:
        table.drop(bind=bind, checkfirst=True)
