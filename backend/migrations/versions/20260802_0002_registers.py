"""registers

Revision ID: 20260802_0002
Revises: 20260802_0001
"""

from alembic import op

from app.models.registers import Offer, Procedure, ProcedureStep, RecordHistory, Sale

revision = "20260802_0002"
down_revision = "20260802_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    for table in [
        Offer.__table__,
        Sale.__table__,
        Procedure.__table__,
        ProcedureStep.__table__,
        RecordHistory.__table__,
    ]:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in [
        RecordHistory.__table__,
        ProcedureStep.__table__,
        Procedure.__table__,
        Sale.__table__,
        Offer.__table__,
    ]:
        table.drop(bind=bind, checkfirst=True)
