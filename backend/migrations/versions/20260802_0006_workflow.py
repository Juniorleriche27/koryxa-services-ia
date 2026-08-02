"""validations actions and audit

Revision ID: 20260802_0006
Revises: 20260802_0005
"""

from alembic import op

from app.models.workflow import ActionComment, AuditEvent, CorrectiveAction, ValidationRequest

revision = "20260802_0006"
down_revision = "20260802_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    for table in [
        ValidationRequest.__table__,
        CorrectiveAction.__table__,
        ActionComment.__table__,
        AuditEvent.__table__,
    ]:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    bind = op.get_bind()
    for table in [
        AuditEvent.__table__,
        ActionComment.__table__,
        CorrectiveAction.__table__,
        ValidationRequest.__table__,
    ]:
        table.drop(bind=bind, checkfirst=True)
