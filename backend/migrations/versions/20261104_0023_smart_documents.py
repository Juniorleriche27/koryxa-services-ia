"""Add Smart Documents living document fields to sales table.

Revision ID: 20261104_0023
Revises: 20261017_0022
"""

import sqlalchemy as sa
from alembic import op

revision = "20261104_0023"
down_revision = "20261017_0022"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("sales", sa.Column("public_token", sa.String(length=64), nullable=True))
    op.add_column("sales", sa.Column("signed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sales", sa.Column("signed_by_name", sa.String(length=180), nullable=True))
    op.add_column("sales", sa.Column("signature_data", sa.Text(), nullable=True))
    op.add_column("sales", sa.Column("view_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("sales", sa.Column("last_viewed_at", sa.DateTime(timezone=True), nullable=True))

    # Populate unique tokens for any existing records
    op.execute(
        "UPDATE sales SET public_token = 'doc_' || md5(random()::text || clock_timestamp()::text) WHERE public_token IS NULL"
    )
    
    op.alter_column("sales", "public_token", nullable=False)
    op.create_index("ix_sales_public_token", "sales", ["public_token"], unique=True)


def downgrade():
    op.drop_index("ix_sales_public_token", table_name="sales")
    op.drop_column("sales", "last_viewed_at")
    op.drop_column("sales", "view_count")
    op.drop_column("sales", "signature_data")
    op.drop_column("sales", "signed_by_name")
    op.drop_column("sales", "signed_at")
    op.drop_column("sales", "public_token")
