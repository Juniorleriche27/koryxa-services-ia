"""CAURI evidence-based balances; never infer missing opening balances or import ledger rows."""
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.finance import CashAccount, CashMovement, FinancialCostClassification
from app.models.registers import Expense


async def account_balances(session: AsyncSession, org_id: str, as_of: date | None = None) -> list[dict]:
    as_of = as_of or date.today()
    accounts = (await session.scalars(select(CashAccount).where(CashAccount.organization_id == org_id))).all()
    result = []
    for account in accounts:
        q = select(CashMovement).where(
            CashMovement.organization_id == org_id, CashMovement.account_id == account.id,
        )
        if as_of is not None:
            q = q.where(CashMovement.occurred_on <= as_of)
        movements = (await session.scalars(q)).all()
        opening_known = account.opening_balance is not None and account.opening_date is not None
        if opening_known and as_of is not None and account.opening_date > as_of:
            opening_known = False
        # Each ledger row is explicitly accounted once. Transfers carry both legs.
        inflows = sum((m.amount for m in movements if m.direction == "in"), Decimal("0"))
        outflows = sum((m.amount for m in movements if m.direction == "out"), Decimal("0"))
        result.append({
            "account_id": account.id,
            "name": account.name,
            "currency": account.currency,
            "opening_date": account.opening_date,
            "opening_balance": account.opening_balance,
            "recorded_inflows": inflows,
            "recorded_outflows": outflows,
            "balance": account.opening_balance + inflows - outflows if opening_known else None,
            "status": "calculable_from_declared_ledger" if opening_known else "missing_opening_balance",
            "reconciliation_status": "not_bank_reconciled",
        })
    return result


async def direct_cost_coverage(session: AsyncSession, org_id: str) -> dict:
    expenses = (await session.scalars(select(Expense).where(
        Expense.organization_id == org_id,
        Expense.is_archived.is_(False),
        Expense.status == "validated",
    ))).all()
    classifications = (await session.scalars(select(FinancialCostClassification).where(
        FinancialCostClassification.organization_id == org_id,
    ))).all()
    classified_ids = {c.expense_id for c in classifications if c.behavior != "unknown" and c.relation != "unknown"}
    return {
        "expense_count": len(expenses),
        "classified_count": sum(1 for e in expenses if e.id in classified_ids),
        "unclassified_count": sum(1 for e in expenses if e.id not in classified_ids),
        "gross_margin": None,
        "break_even_point": None,
        "reason": "La classification seule ne démontre ni le coût des ventes ni la complétude des charges.",
    }
