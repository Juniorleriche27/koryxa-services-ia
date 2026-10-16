"""Optional tenant-scoped financial evidence. No simulated balances or backfills."""
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4
from sqlalchemy import Date, DateTime, ForeignKey, ForeignKeyConstraint, Numeric, String, Text, Boolean, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


def uid() -> str:
    return str(uuid4())


class CashAccount(Base):
    __tablename__ = "finance_cash_accounts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    currency: Mapped[str] = mapped_column(String(3))
    opening_balance: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    opening_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_finance_cash_account_name_per_org"),
        UniqueConstraint("organization_id", "id", name="uq_finance_cash_accounts_org_id"),
    )


class CashMovement(Base):
    __tablename__ = "finance_cash_movements"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("finance_cash_accounts.id", ondelete="RESTRICT"), index=True)
    occurred_on: Mapped[date] = mapped_column(Date)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    direction: Mapped[str] = mapped_column(String(8))  # in / out
    category: Mapped[str] = mapped_column(String(40))  # sale_payment, expense_payment, capital, loan, transfer, other
    source_kind: Mapped[str | None] = mapped_column(String(40), nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    transfer_group_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (
        UniqueConstraint("organization_id", "source_kind", "source_id", "direction", name="uq_finance_cash_movement_source"),
        ForeignKeyConstraint(
            ["organization_id", "account_id"],
            ["finance_cash_accounts.organization_id", "finance_cash_accounts.id"],
            name="fk_finance_cash_movement_tenant_account", ondelete="RESTRICT",
        ),
    )


class FinancialCostClassification(Base):
    __tablename__ = "finance_cost_classifications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    expense_id: Mapped[str] = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), index=True)
    behavior: Mapped[str] = mapped_column(String(16))  # fixed / variable / unknown
    relation: Mapped[str] = mapped_column(String(16))  # direct / indirect / unknown
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_by_user_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    __table_args__ = (
        UniqueConstraint("organization_id", "expense_id", name="uq_finance_classification_expense"),
        ForeignKeyConstraint(
            ["organization_id", "expense_id"], ["expenses.organization_id", "expenses.id"],
            name="fk_finance_cost_classification_tenant_expense", ondelete="CASCADE",
        ),
    )
