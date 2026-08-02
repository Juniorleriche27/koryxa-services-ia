"""radar
Revision ID: 20260802_0005
Revises: 20260802_0004
"""

from alembic import op

from app.models.radar import RadarAlert, RadarDocumentFact, RadarRuleConfig, RadarRun

revision = "20260802_0005"
down_revision = "20260802_0004"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    for table in [
        RadarRuleConfig.__table__,
        RadarRun.__table__,
        RadarAlert.__table__,
        RadarDocumentFact.__table__,
    ]:
        table.create(bind=bind, checkfirst=True)


def downgrade():
    bind = op.get_bind()
    for table in [
        RadarDocumentFact.__table__,
        RadarAlert.__table__,
        RadarRun.__table__,
        RadarRuleConfig.__table__,
    ]:
        table.drop(bind=bind, checkfirst=True)
