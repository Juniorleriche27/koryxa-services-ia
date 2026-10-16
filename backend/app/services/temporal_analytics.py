"""Phase 6: tenant-scoped historic periods and conservative financial projections."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.registers import Sale, Expense
from app.services.financial_metrics import summarize_registers
from app.services.analytics_contract import exact_decimal, round_money


@dataclass(frozen=True)
class DateWindow:
    start: date
    end: date  # exclusive

    def __post_init__(self):
        if self.end <= self.start:
            raise ValueError("La fin doit être postérieure au début")
        if (self.end - self.start).days > 3660:
            raise ValueError("Fenêtre supérieure à dix ans")

    @property
    def days(self) -> int:
        return (self.end - self.start).days

    @property
    def previous(self) -> "DateWindow":
        return DateWindow(self.start - timedelta(days=self.days), self.start)


def compare_values(current: Decimal | None, previous: Decimal | None) -> dict[str, Any]:
    if current is None or previous is None:
        return {"status": "incomplet", "delta": None, "percent": None}
    a, b = exact_decimal(current), exact_decimal(previous)
    return {"status": "calculable" if b != 0 else "non_applicable",
            "delta": str(round_money(a - b)),
            "percent": str(round_money((a - b) / b * 100)) if b != 0 else None}


def projection_scenarios(*, opening_cash: Decimal | None, inflows: Decimal | None,
                         outflows: Decimal | None, observed_days: int | None,
                         horizon_days: int = 30, complete: bool = False) -> dict[str, Any]:
    """Linear scenarios, not probabilities; never infer certified cash from registers."""
    if not 1 <= horizon_days <= 365:
        raise ValueError("Horizon invalide")
    if not complete or opening_cash is None or inflows is None or outflows is None or not observed_days:
        return {"status": "incomplet", "scenarios": None, "reason": "Solde et historique de flux complets nécessaires"}
    if observed_days <= 0:
        raise ValueError("Observation invalide")
    cash, inc, out = exact_decimal(opening_cash), exact_decimal(inflows), exact_decimal(outflows)
    if inc < 0 or out < 0:
        raise ValueError("Les flux doivent être positifs")
    factor = Decimal(horizon_days) / Decimal(observed_days)
    # Assumptions explicit: base trend; prudent reduces receipts/increases expenses.
    assumptions = {"prudent": (Decimal("0.8"), Decimal("1.2")),
                   "central": (Decimal("1"), Decimal("1")),
                   "favorable": (Decimal("1.2"), Decimal("0.8"))}
    scenarios = {name: str(round_money(cash + (inc * income_factor - out * expense_factor) * factor))
                 for name, (income_factor, expense_factor) in assumptions.items()}
    return {"status": "calculable", "horizon_days": horizon_days, "scenarios": scenarios,
            "currency_rule": "same_currency_only", "method": "linear_observed_cash_flow_v1",
            "assumptions": {"prudent": "encaissements -20%, décaissements +20%",
                            "central": "rythme observé constant",
                            "favorable": "encaissements +20%, décaissements -20%"}}


def trend_signals(metric: str, current: Decimal | None, previous: Decimal | None,
                  *, minimum_reference: Decimal = Decimal("0")) -> list[dict[str, str]]:
    """Interpret a comparable trend, without making causal or predictive claims."""
    if current is None or previous is None or exact_decimal(previous) <= minimum_reference:
        return []
    change = (exact_decimal(current) - exact_decimal(previous)) / exact_decimal(previous)
    direction = "up" if change > Decimal("0.2") else "down" if change < Decimal("-0.2") else None
    if not direction:
        return []
    return [{"metric": metric, "direction": direction, "change_percent": str(round_money(change * 100)),
             "status": "observation", "cause": "non_determinee"}]


async def temporal_snapshot(session: AsyncSession, org_id: str, window: DateWindow) -> dict[str, Any]:
    prev = window.previous
    sales = (await session.scalars(select(Sale).where(Sale.organization_id == org_id,
                 Sale.sale_date >= prev.start, Sale.sale_date < window.end))).all()
    expenses = (await session.scalars(select(Expense).where(Expense.organization_id == org_id,
                    Expense.expense_date >= prev.start, Expense.expense_date < window.end))).all()

    def calc(w: DateWindow) -> dict[str, Any]:
        result = summarize_registers(
            (sale for sale in sales if w.start <= sale.sale_date < w.end),
            (expense for expense in expenses if w.start <= expense.expense_date < w.end),
        ).summary
        return result

    current, previous = calc(window), calc(prev)
    comparable = (current.get("financial_data_status") == "registers_only" and
                  previous.get("financial_data_status") == "registers_only" and
                  current.get("primary_currency") == previous.get("primary_currency") and
                  current.get("currency_codes") == previous.get("currency_codes") and
                  bool(current.get("currency_codes")))
    keys = ("total_sales_amount", "total_paid_amount", "total_expenses_paid", "total_unpaid_amount")
    comparisons = {key: compare_values(current.get(key), previous.get(key)) if comparable else
                   {"status": "incompatible", "delta": None, "percent": None} for key in keys}
    signals = trend_signals("total_sales_amount", current.get("total_sales_amount"),
                            previous.get("total_sales_amount")) if comparable else []
    return {"schema_version": "1.0", "organization_id": org_id,
            "window": {"start": window.start.isoformat(), "end_exclusive": window.end.isoformat()},
            "previous_window": {"start": prev.start.isoformat(), "end_exclusive": prev.end.isoformat()},
            "currency_comparable": comparable, "comparisons": comparisons, "signals": signals,
            "forecast": {"status": "incomplet", "reason": "Flux et trésorerie certifiés requis", "scenarios": None},
            "date_semantics": "sale_date/expense_date; not cash settlement dates"}
