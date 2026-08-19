"""Add business_category, stocks tracking and attendance table for Phase 1.

Revision ID: 20260819_0011
Revises: 20260809_0010
"""

import sqlalchemy as sa
from alembic import op

revision = "20260819_0011"
down_revision = "20260809_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Update organizations table
    op.add_column(
        "organizations",
        sa.Column("business_category", sa.String(40), nullable=False, server_default="retail"),
    )
    op.create_index("ix_organizations_business_category", "organizations", ["business_category"])
    op.add_column("organizations", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("organizations", sa.Column("longitude", sa.Float(), nullable=True))
    op.add_column(
        "organizations",
        sa.Column("geofence_radius_meters", sa.Integer(), nullable=False, server_default="50"),
    )

    # 2. Update offers table for inventory / stock tracking
    op.add_column(
        "offers",
        sa.Column("track_stock", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_offers_track_stock", "offers", ["track_stock"])
    op.add_column(
        "offers",
        sa.Column("stock_quantity", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
    )
    op.add_column(
        "offers",
        sa.Column("min_stock_alert", sa.Numeric(12, 2), nullable=False, server_default="5.00"),
    )
    op.add_column("offers", sa.Column("cost_price", sa.Numeric(14, 2), nullable=True))

    # 3. Create attendance_records table
    op.create_table(
        "attendance_records",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "organization_id",
            sa.String(36),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("employee_id", sa.String(128), nullable=False),
        sa.Column("employee_name", sa.String(180), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("check_in_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_out_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_in_lat", sa.Float(), nullable=True),
        sa.Column("check_in_lng", sa.Float(), nullable=True),
        sa.Column("check_out_lat", sa.Float(), nullable=True),
        sa.Column("check_out_lng", sa.Float(), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="present"),
        sa.Column("verified_by", sa.String(50), nullable=False, server_default="qr_dynamic_gps"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        "ix_attendance_records_org_date",
        "attendance_records",
        ["organization_id", "date"],
    )
    op.create_index(
        "ix_attendance_records_emp",
        "attendance_records",
        ["employee_id"],
    )


def downgrade() -> None:
    op.drop_table("attendance_records")
    op.drop_index("ix_offers_track_stock", table_name="offers")
    op.drop_column("offers", "cost_price")
    op.drop_column("offers", "min_stock_alert")
    op.drop_column("offers", "stock_quantity")
    op.drop_column("offers", "track_stock")
    op.drop_index("ix_organizations_business_category", table_name="organizations")
    op.drop_column("organizations", "geofence_radius_meters")
    op.drop_column("organizations", "longitude")
    op.drop_column("organizations", "latitude")
    op.drop_column("organizations", "business_category")
