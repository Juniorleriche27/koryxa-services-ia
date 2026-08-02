"""knowlia sync
Revision ID: 20260802_0004
Revises: 20260802_0003
"""

from alembic import op

from app.models.knowlia import KnowliaSyncJob

revision = "20260802_0004"
down_revision = "20260802_0003"
branch_labels = None
depends_on = None


def upgrade():
    KnowliaSyncJob.__table__.create(bind=op.get_bind(), checkfirst=True)


def downgrade():
    KnowliaSyncJob.__table__.drop(bind=op.get_bind(), checkfirst=True)
