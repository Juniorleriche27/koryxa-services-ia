"""imports and files
Revision ID: 20260802_0003
Revises: 20260802_0002
"""

from alembic import op

from app.models.imports import Attachment, ImportJob

revision = "20260802_0003"
down_revision = "20260802_0002"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    ImportJob.__table__.create(bind=bind, checkfirst=True)
    Attachment.__table__.create(bind=bind, checkfirst=True)


def downgrade():
    bind = op.get_bind()
    Attachment.__table__.drop(bind=bind, checkfirst=True)
    ImportJob.__table__.drop(bind=bind, checkfirst=True)
