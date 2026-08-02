"""organization branding

Revision ID: 20260802_0007
Revises: 20260802_0006
"""

import sqlalchemy as sa
from alembic import op

revision = "20260802_0007"
down_revision = "20260802_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("logo_storage_key", sa.String(500), nullable=True))
    op.add_column("organizations", sa.Column("logo_content_type", sa.String(100), nullable=True))
    op.add_column("organizations", sa.Column("logo_updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "logo_updated_at")
    op.drop_column("organizations", "logo_content_type")
    op.drop_column("organizations", "logo_storage_key")
