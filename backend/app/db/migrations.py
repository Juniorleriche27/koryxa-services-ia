from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.logging import get_logger
from app.db.base import Base

logger = get_logger(__name__)


async def run_auto_migrations(engine: AsyncEngine) -> None:
    """Ensures all tables exist and all newly added columns are present in the database."""
    async with engine.begin() as conn:
        # 1. Create any missing tables defined in Base metadata
        await conn.run_sync(Base.metadata.create_all)

        # 2. Add newly introduced columns if using PostgreSQL
        is_postgres = "postgresql" in engine.dialect.name

        if is_postgres:
            statements = [
                # Sales table extensions
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_type VARCHAR(32) DEFAULT 'invoice'",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(18, 2) DEFAULT 0.00",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date DATE",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5, 2)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_history JSON DEFAULT '[]'::json",
                # Expenses table extensions
                "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS document_type VARCHAR(32) DEFAULT 'expense_receipt'",
                "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14, 2)",
                "ALTER TABLE expenses ADD COLUMN IF NOT EXISTS due_date DATE",
                # Offers table extensions
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS track_stock BOOLEAN DEFAULT FALSE",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(12, 2) DEFAULT 0.00",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS min_stock_alert NUMERIC(12, 2) DEFAULT 5.00",
                "ALTER TABLE offers ADD COLUMN IF NOT EXISTS cost_price NUMERIC(14, 2)",
                # Backfill data for consistency
                "UPDATE sales SET document_type = 'invoice' WHERE document_type IS NULL",
                "UPDATE sales SET paid_amount = total_amount WHERE (paid_amount IS NULL OR paid_amount = 0) AND (payment_status = 'paid' OR payment_status = 'PAID')",
                "UPDATE expenses SET document_type = 'expense_receipt' WHERE document_type IS NULL",
                # Normalize legacy uppercase enum values to lowercase
                "UPDATE sales SET payment_status = LOWER(payment_status) WHERE payment_status IS NOT NULL",
                "UPDATE sales SET status = LOWER(status) WHERE status IS NOT NULL",
                "UPDATE sales SET source = LOWER(source) WHERE source IS NOT NULL",
                "UPDATE sales SET document_type = LOWER(document_type) WHERE document_type IS NOT NULL",
                "UPDATE expenses SET payment_status = LOWER(payment_status) WHERE payment_status IS NOT NULL",
                "UPDATE expenses SET status = LOWER(status) WHERE status IS NOT NULL",
                "UPDATE expenses SET source = LOWER(source) WHERE source IS NOT NULL",
                "UPDATE expenses SET document_type = LOWER(document_type) WHERE document_type IS NOT NULL",
                "UPDATE offers SET status = LOWER(status) WHERE status IS NOT NULL",
                "UPDATE offers SET source = LOWER(source) WHERE source IS NOT NULL",
                "UPDATE procedures SET status = LOWER(status) WHERE status IS NOT NULL",
                "UPDATE procedures SET source = LOWER(source) WHERE source IS NOT NULL",
            ]
            for stmt in statements:
                try:
                    await conn.execute(text(stmt))
                except Exception as exc:
                    logger.warning("migration_statement_skipped", stmt=stmt, error=str(exc))

    logger.info("auto_migrations_completed")
