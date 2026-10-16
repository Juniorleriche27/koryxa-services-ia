"""Authoritative operational dashboard summary shared by routes and Cora."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.attendance import AttendanceRecord
from app.models.registers import Offer, Procedure, Supplier
from app.services.financial_metrics import collect_financial_registers
from app.services.finance_ledger import account_balances, direct_cost_coverage
from app.services.financial_analysis import FinancialEvidence, calculate_financial_indicators

async def fetch_summary(s: AsyncSession, org_id: str) -> dict[str, Any]:
    snapshot = await collect_financial_registers(s, org_id)
    financial_summary = snapshot.summary
    accounts = await account_balances(s, org_id)
    coverage = await direct_cost_coverage(s, org_id)
    # A declared ledger balance is useful but is not a bank-reconciled balance.
    complete = bool(accounts) and all(a["balance"] is not None for a in accounts)
    currencies = {a["currency"] for a in accounts}
    comparable = len(currencies) == 1
    declared_balance = (sum((a["balance"] for a in accounts), Decimal("0"))
                        if complete and comparable else None)
    reasons = {
        "estimated_gross_margin": "Coûts directs associés aux ventes à renseigner.",
        "gross_margin_rate": "Marge brute non déterminée : coûts des ventes incomplets.",
        "break_even_point": "Charges fixes et taux de marge sur coûts variables à justifier.",
        "break_even_progress": "Point mort non déterminé.",
        "cash_runway_days": "Historique de décaissements récurrents insuffisant ou non rapproché.",
        "daily_burn_rate": "Période d'observation et sorties récurrentes à documenter.",
        "working_capital": "Bilan requis : ressources stables et emplois stables.",
        "net_cash_position": "Trésorerie certifiée : rapprochement bancaire manquant.",
    }
    if coverage["unclassified_count"]:
        reasons["estimated_gross_margin"] = f"{coverage['unclassified_count']} dépense(s) à classifier et rapprocher des ventes."
    if not accounts:
        reasons["cash_runway_days"] = "Créer un compte et saisir son solde initial vérifié."
        reasons["net_cash_position"] = "Aucun compte de trésorerie renseigné."
    elif not complete:
        reasons["cash_runway_days"] = "Compléter les soldes d'ouverture des comptes."
    elif not comparable:
        reasons["cash_runway_days"] = "Comptes multidevises : conversion fiable nécessaire."
    # This projection uses only evidence backed by the existing ledgers. The
    # classification of expenses alone does not attest to complete costs.
    currency = financial_summary.get("primary_currency")
    analysis = calculate_financial_indicators(FinancialEvidence(
        organization_id=org_id,
        currency=currency if currency and len(currency) == 3 else "XXX",
        period="all_time",
        revenue=financial_summary.get("total_sales_amount") if currency else None,
    ))
    financial_summary = {
        **financial_summary,
        "financial_analysis": {key: result.model_dump(mode="json") for key, result in analysis.items()},
        "declared_cash_balance": declared_balance,
        "declared_cash_currency": next(iter(currencies)) if comparable and currencies else None,
        "declared_cash_status": ("declared_unreconciled" if declared_balance is not None else "missing_or_incompatible"),
        "financial_indicator_reasons": reasons,
        "cost_classification_coverage": coverage,
    }

    offers_agg = await s.execute(
        select(
            func.count(Offer.id).label("total"),
            func.coalesce(
                func.sum(case((Offer.track_stock.is_(True), Decimal("1")), else_=Decimal("0"))),
                Decimal("0"),
            ).label("active_products"),
            func.coalesce(
                func.sum(case(
                    (and_(Offer.track_stock.is_(True),
                          Offer.stock_quantity <= func.coalesce(Offer.min_stock_alert, Decimal("5"))),
                     Decimal("1")), else_=Decimal("0"),
                )),
                Decimal("0"),
            ).label("low_stock"),
            func.coalesce(
                func.sum(case(
                    (Offer.track_stock.is_(True),
                     func.coalesce(Offer.stock_quantity, Decimal("0"))
                     * func.coalesce(Offer.cost_price, func.coalesce(Offer.price, Decimal("0")))),
                    else_=Decimal("0"),
                )),
                Decimal("0"),
            ).label("stock_value"),
        ).where(Offer.organization_id == org_id, Offer.is_archived.is_(False))
    )
    orr = offers_agg.one()
    offers_count = int(orr.total or 0)
    active_products_count = int(orr.active_products or 0)
    low_stock_count = int(orr.low_stock or 0)
    total_stock_value = Decimal(str(orr.stock_value or 0))

    procedures_count = int(await s.scalar(
        select(func.count()).select_from(Procedure)
        .where(Procedure.organization_id == org_id, Procedure.is_archived.is_(False))
    ) or 0)
    suppliers_count = int(await s.scalar(
        select(func.count()).select_from(Supplier).where(Supplier.organization_id == org_id)
    ) or 0)
    present_today = int(await s.scalar(
        select(func.count()).select_from(AttendanceRecord).where(
            AttendanceRecord.organization_id == org_id,
            AttendanceRecord.date == date.today(),
            AttendanceRecord.status.in_(["present", "late"]),
        )
    ) or 0)

    return {
        **financial_summary,
        "offers_count": offers_count,
        "procedures_count": procedures_count,
        "suppliers_count": suppliers_count,
        "total_stock_value": total_stock_value,
        "low_stock_count": low_stock_count,
        "active_products_count": active_products_count,
        "present_employees_today_count": present_today,
    }

