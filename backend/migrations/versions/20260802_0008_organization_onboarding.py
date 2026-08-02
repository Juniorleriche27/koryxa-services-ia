"""Add organization onboarding profile.

Revision ID: 20260802_0008
Revises: 20260802_0007
"""

from alembic import op
import sqlalchemy as sa

revision = "20260802_0008"
down_revision = "20260802_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("sector", sa.String(length=120), nullable=True))
    op.add_column("organizations", sa.Column("country", sa.String(length=120), nullable=True))
    op.add_column("organizations", sa.Column("responsible_name", sa.String(length=180), nullable=True))
    op.add_column("organizations", sa.Column("responsible_role", sa.String(length=120), nullable=True))
    op.add_column("organizations", sa.Column("primary_goal", sa.String(length=50), nullable=True))
    op.add_column("organizations", sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "onboarding_completed_at")
    op.drop_column("organizations", "primary_goal")
    op.drop_column("organizations", "responsible_role")
    op.drop_column("organizations", "responsible_name")
    op.drop_column("organizations", "country")
    op.drop_column("organizations", "sector")
