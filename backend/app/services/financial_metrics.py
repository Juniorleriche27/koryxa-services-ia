"""CAURI's shared, auditable financial register summary.

The scope is ALL recorded dates (not a monthly statement). Only validated
invoices/receipts and validated expenses are considered. Amounts are declarations
in operational registers, not bank reconciliation or statutory accounts.

No real cash balance, gross margin, break-even point, 30-day projection,
runway, or working capital can be inferred from these registers alone.
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.registers import (
    DocumentType,
    Expense,
    PaymentStatus,
    Sale,
)
from app.services.analytics_contract import exact_decimal, round_money

ZERO = Decimal("0")
HUNDRED = Decimal("100")
ALLOWED_SALES_DOCUMENTS = frozenset({DocumentType.INVOICE, DocumentType.RECEIPT})
EXCLUDED_PAYMENTS = frozenset({PaymentStatus.CANCELLED, PaymentStatus.REFUNDED})


def _value(value: Any) -> str:
    return str(value.value if hasattr(value, "value") else value).lower()


def _decimal(value: Any) -> Decimal:
    return exact_decimal(value if value is not None else ZERO)


def _paid_amount(record: Any) -> tuple[Decimal, bool]:
    """Use the stored amount exactly once, capped to the document amount.

    A 'paid' status without a matching numeric amount is *unknown*, not proof
    of a full payment. This is especially important for historical expenses.
    """
    amount = max(ZERO, _decimal(record.total_amount if isinstance(record, Sale) else record.amount))
    raw = getattr(record, "paid_amount", None)
    status = _value(record.payment_status)
    if status in {"cancelled", "refunded"}:
        return ZERO, False
    recorded_paid = _decimal(raw)
    paid = min(amount, max(ZERO, recorded_paid))
    # A ledger conflict must never be hidden by capping the value for display.
    inconsistent_amount = recorded_paid < ZERO or recorded_paid > amount
    inconsistent_status = (
        (status == "paid" and paid != amount)
        or (status == "partial" and not (ZERO < paid < amount))
        or (status == "unpaid" and paid != ZERO)
    )
    return paid, inconsistent_amount or inconsistent_status


def _money(value: Decimal | None) -> Decimal | None:
    return round_money(value) if value is not None else None


@dataclass(frozen=True)
class FinancialRegisterSnapshot:
    summary: dict[str, Any]
    sales: tuple[Sale, ...]
    expenses: tuple[Expense, ...]


def summarize_registers(
    sales: Iterable[Sale],
    expenses: Iterable[Expense],
    *,
    today: date | None = None,
) -> FinancialRegisterSnapshot:
    """Pure computation, safe for unit testing without a database.

    The caller must also enforce organization_id in its database queries.
    """
    today = today or date.today()
    all_sales = tuple(sales)
    all_expenses = tuple(expenses)
    selected_sales = tuple(
        sale for sale in all_sales
        if not sale.is_archived
        and _value(sale.status) == "validated"
        and _value(sale.document_type) in {"invoice", "receipt"}
        and _value(sale.payment_status) not in {"cancelled", "refunded"}
    )
    selected_expenses = tuple(
        exp for exp in all_expenses
        if not exp.is_archived
        and _value(exp.status) == "validated"
        and _value(exp.payment_status) not in {"cancelled", "refunded"}
    )
    currencies = sorted({
        str(rec.currency).strip().upper()
        for rec in (*selected_sales, *selected_expenses)
        if getattr(rec, "currency", None)
    })
    mixed = len(currencies) > 1
    missing_currency = any(not getattr(rec, "currency", None) for rec in (*selected_sales, *selected_expenses))
    currency = currencies[0] if len(currencies) == 1 else "XOF"

    sales_amount = ZERO
    sales_paid = ZERO
    partial_outstanding = ZERO
    receivable_overdue = ZERO
    receivable_not_due = ZERO
    receivable_due_today = ZERO
    receivable_no_due_date = ZERO
    expenses_paid = ZERO
    expenses_unpaid = ZERO
    payable_overdue = ZERO
    incomplete = False
    warnings: list[str] = []

    for sale in selected_sales:
        amount = max(ZERO, _decimal(sale.total_amount))
        paid, paid_unknown = _paid_amount(sale)
        incomplete |= paid_unknown
        sales_amount += amount
        sales_paid += paid
        remaining = amount - paid
        if _value(sale.payment_status) == "partial":
            partial_outstanding += remaining
        if remaining > ZERO:
            if sale.due_date is None:
                receivable_no_due_date += remaining
            elif sale.due_date < today:
                receivable_overdue += remaining
            elif sale.due_date > today:
                receivable_not_due += remaining
            else:
                receivable_due_today += remaining

    for expense in selected_expenses:
        amount = max(ZERO, _decimal(expense.amount))
        paid, paid_unknown = _paid_amount(expense)
        incomplete |= paid_unknown
        expenses_paid += paid
        remaining = amount - paid
        expenses_unpaid += remaining
        if remaining > ZERO and expense.due_date is not None and expense.due_date < today:
            payable_overdue += remaining

    if mixed:
        warnings.append("Plusieurs devises sont présentes. Aucun total monétaire interdevises n'est calculé.")
    if missing_currency:
        warnings.append("Certains mouvements n'indiquent pas de devise.")
    if incomplete:
        warnings.append("Au moins un paiement déclaré ne correspond pas au montant enregistré. Vérifier les écritures.")
    warnings.append("Périmètre : historique complet des documents validés, sans solde d'ouverture ni autres mouvements de trésorerie.")

    comparable = not mixed and not missing_currency
    paid_reliable = comparable and not incomplete
    unpaid = sales_amount - sales_paid
    recovery = (
        float((sales_paid / sales_amount * HUNDRED).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
        if paid_reliable and sales_amount > ZERO else None
    )
    aov = (
        float((sales_amount / len(selected_sales)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        if comparable and selected_sales else None
    )
    summary: dict[str, Any] = {
        "total_sales_count": len(selected_sales),
        "sales_records_count": len(all_sales),
        "excluded_sales_count": len(all_sales) - len(selected_sales),
        "pending_validation_sales_count": sum(1 for row in all_sales if _value(row.status) in {"draft", "to_verify"}),
        "expenses_count": len(selected_expenses),
        "excluded_expenses_count": len(all_expenses) - len(selected_expenses),
        "total_sales_amount": _money(sales_amount) if comparable else None,
        "total_paid_amount": _money(sales_paid) if paid_reliable else None,
        "total_unpaid_amount": _money(unpaid) if paid_reliable else None,
        "total_partial_amount": _money(partial_outstanding) if paid_reliable else None,
        "total_expenses_paid": _money(expenses_paid) if paid_reliable else None,
        "total_expenses_unpaid": _money(expenses_unpaid) if paid_reliable else None,
        "receivables_overdue": _money(receivable_overdue) if paid_reliable else None,
        "receivables_not_due": _money(receivable_not_due) if paid_reliable else None,
        "receivables_due_today": _money(receivable_due_today) if paid_reliable else None,
        "receivables_without_due_date": _money(receivable_no_due_date) if paid_reliable else None,
        "payables_overdue": _money(payable_overdue) if paid_reliable else None,
        "cash_movement_net": _money(sales_paid - expenses_paid) if paid_reliable else None,
        "net_cash_position": None,
        "estimated_gross_margin": None,
        "gross_margin_rate": None,
        "break_even_point": None,
        "break_even_progress": None,
        "daily_burn_rate": None,
        "cash_runway_days": None,
        "working_capital": None,
        "projected_30d_cash": None,
        "average_order_value": aov,
        "recovery_rate": recovery,
        "primary_currency": currency,
        "currency_codes": currencies,
        "financial_data_status": (
            "mixed_currencies" if mixed else "missing_currency" if missing_currency
            else "incomplete_payments" if incomplete else "registers_only"
        ),
        "financial_warnings": warnings,
        "aggregation_period": "all_time",
        "recent_sales": sorted(selected_sales, key=lambda row: row.sale_date, reverse=True)[:10],
    }
    return FinancialRegisterSnapshot(summary, selected_sales, selected_expenses)


async def collect_financial_registers(s: AsyncSession, org_id: str) -> FinancialRegisterSnapshot:
    """Database isolation is enforced before arithmetic; memory use is bounded.

    When the configured evidence budget is exceeded, no partial monetary total is
    returned as reliable. This is deliberately fail-closed until SQL aggregation
    or a warehouse is selected for that tenant's volume.
    """
    limit = get_settings().max_analytics_records
    sale_count = int(await s.scalar(select(func.count()).select_from(Sale).where(
        Sale.organization_id == org_id, Sale.is_archived.is_(False),
    )) or 0)
    expense_count = int(await s.scalar(select(func.count()).select_from(Expense).where(
        Expense.organization_id == org_id, Expense.is_archived.is_(False),
    )) or 0)
    sales = (await s.scalars(select(Sale).where(
        Sale.organization_id == org_id, Sale.is_archived.is_(False),
    ).order_by(Sale.sale_date.desc()).limit(limit + 1))).all()
    expenses = (await s.scalars(select(Expense).where(
        Expense.organization_id == org_id, Expense.is_archived.is_(False),
    ).order_by(Expense.expense_date.desc()).limit(limit + 1))).all()
    if sale_count > limit or expense_count > limit:
        snapshot = summarize_registers(sales[:limit], expenses[:limit])
        summary = dict(snapshot.summary)
        for key in (
            "total_sales_amount", "total_paid_amount", "total_unpaid_amount",
            "total_partial_amount", "total_expenses_paid", "total_expenses_unpaid",
            "receivables_overdue", "receivables_not_due", "receivables_due_today",
            "receivables_without_due_date", "payables_overdue", "cash_movement_net",
            "average_order_value", "recovery_rate",
        ):
            summary[key] = None
        summary.update({
            "sales_records_count": sale_count,
            "expenses_records_count": expense_count,
            "financial_data_status": "analytics_capacity_exceeded",
            "financial_warnings": [
                f"Volume supérieur au budget analytique de {limit} écritures par registre; "
                "aucun total partiel n'est présenté comme fiable."
            ],
        })
        return FinancialRegisterSnapshot(summary, tuple(sales[:limit]), tuple(expenses[:limit]))
    return summarize_registers(sales, expenses)
