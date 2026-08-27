"""Normalize legacy membership and invitation enum values.

Revision ID: 20260827_0012
Revises: 20260819_0011
"""

from alembic import op

revision = "20260827_0012"
down_revision = "20260819_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE organization_members SET role = lower(role), status = lower(status)")
    op.execute("UPDATE organization_invitations SET role = lower(role), status = lower(status)")


def downgrade() -> None:
    op.execute("UPDATE organization_members SET role = upper(role), status = upper(status)")
    op.execute("UPDATE organization_invitations SET role = upper(role), status = upper(status)")
