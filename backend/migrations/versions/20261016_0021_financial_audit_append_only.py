"""Append-only financial mutation audit.

Revision ID: 20261016_0021
Revises: 20261016_0020
"""
import sqlalchemy as sa
from alembic import op

revision = "20261016_0021"
down_revision = "20261016_0020"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "financial_audit_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36), sa.ForeignKey("organizations.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("entity_type", sa.String(40), nullable=False),
        sa.Column("entity_id", sa.String(36), nullable=False),
        sa.Column("event_type", sa.String(80), nullable=False),
        sa.Column("actor_user_id", sa.String(120), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("organization_id", "entity_type", "entity_id", "event_type", "actor_user_id", "created_at"):
        op.create_index(f"ix_financial_audit_events_{column}", "financial_audit_events", [column])
    op.execute("""
        CREATE FUNCTION cauri_reject_financial_audit_mutation() RETURNS trigger
        LANGUAGE plpgsql AS $$ BEGIN
          RAISE EXCEPTION 'financial_audit_events is append-only' USING ERRCODE = '55000';
        END $$
    """)
    op.execute("""
        CREATE TRIGGER trg_financial_audit_append_only
        BEFORE UPDATE OR DELETE ON financial_audit_events
        FOR EACH ROW EXECUTE FUNCTION cauri_reject_financial_audit_mutation()
    """)


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS trg_financial_audit_append_only ON financial_audit_events")
    op.drop_table("financial_audit_events")
    op.execute("DROP FUNCTION IF EXISTS cauri_reject_financial_audit_mutation()")
