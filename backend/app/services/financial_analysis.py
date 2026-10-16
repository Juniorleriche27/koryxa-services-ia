"""CAURI phase 5: deterministic analytical formulas with explicit evidence gates.

No implicit inference from the expense classification table, and no simulated
bank reconciliation. Monetary arithmetic stays Decimal throughout.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from app.services.analytics_contract import MetricResult, MetricStatus, exact_decimal, round_money


@dataclass(frozen=True)
class FinancialEvidence:
    organization_id: str
    currency: str
    period: str
    revenue: Decimal | None = None
    cost_of_sales: Decimal | None = None
    variable_costs: Decimal | None = None
    fixed_costs: Decimal | None = None
    operating_income: Decimal | None = None
    operating_expenses: Decimal | None = None
    stable_resources: Decimal | None = None
    stable_assets: Decimal | None = None
    operating_current_assets: Decimal | None = None
    operating_current_liabilities: Decimal | None = None
    # Verified net usable cash and a documented representative observation period.
    usable_cash: Decimal | None = None
    cash_outflows: Decimal | None = None
    cash_inflows: Decimal | None = None
    observed_days: int | None = None
    # Evidence of full capture for the specific accounting perimeter.
    costs_complete: bool = False
    balance_sheet_complete: bool = False
    cash_flows_complete: bool = False


def calculate_financial_indicators(evidence: FinancialEvidence) -> dict[str, MetricResult]:
    """Only complete, comparable inputs can make an indicator calculable.

    No defaulting missing amounts to zero. A non-positive contribution margin
    makes break-even not applicable, and non-positive burn makes runway N/A.
    """
    e = evidence
    if not e.organization_id or not e.period or len(e.currency) != 3 or e.currency != e.currency.upper():
        raise ValueError("Entreprise, période et devise ISO requises")
    values: dict[str, Decimal | None] = {}
    for field in ("revenue", "cost_of_sales", "variable_costs", "fixed_costs", "operating_income", "operating_expenses", "stable_resources", "stable_assets", "operating_current_assets", "operating_current_liabilities", "usable_cash", "cash_outflows", "cash_inflows"):
        raw = getattr(e, field)
        values[field] = exact_decimal(raw) if raw is not None else None
    for field in ("cost_of_sales", "variable_costs", "fixed_costs", "cash_outflows", "cash_inflows"):
        if values[field] is not None and values[field] < 0:
            raise ValueError(f"Le coût/flux {field} ne peut pas être négatif")
    if e.observed_days is not None and (isinstance(e.observed_days, bool) or e.observed_days <= 0):
        raise ValueError("Période d'observation invalide")

    results: dict[str, MetricResult] = {}

    def emit(code: str, value: Decimal | None, *, reason: str = "", unit: str = "money", status: MetricStatus | None = None, sources: tuple[str, ...] = ()):
        state = status or (MetricStatus.CALCULABLE if value is not None else MetricStatus.INCOMPLETE)
        results[code] = MetricResult(
            code=code, value=round_money(value) if value is not None else None,
            unit=unit, currency=e.currency if unit == "money" else None,
            period=e.period, organization_id=e.organization_id,
            formula_version="5.1", status=state,
            reason=reason if value is None else None, sources=list(sources),
        )

    rev, cost = values["revenue"], values["cost_of_sales"]
    gross = rev - cost if e.costs_complete and rev is not None and cost is not None else None
    emit("estimated_gross_margin", gross, reason="Périmètre et coût des ventes complets requis.", sources=("validated_sales", "verified_cost_of_sales"))
    gross_rate = gross / rev * 100 if gross is not None and rev != 0 else None
    emit("gross_margin_rate", gross_rate, unit="percent", reason="Chiffre d'affaires non nul et marge brute déterminée.")

    variable, fixed = values["variable_costs"], values["fixed_costs"]
    contribution = rev - variable if e.costs_complete and rev is not None and variable is not None else None
    emit("contribution_margin", contribution, reason="Coûts variables complets requis.")
    contribution_rate = contribution / rev if contribution is not None and rev > 0 else None
    break_even = fixed / contribution_rate if fixed is not None and contribution_rate is not None and contribution_rate > 0 else None
    status = MetricStatus.NOT_APPLICABLE if contribution_rate is not None and contribution_rate <= 0 else None
    emit("break_even_point", break_even, reason="Taux de marge sur coûts variables positif et charges fixes complets requis.", status=status)
    # Progress is a ratio of revenue / break-even, not a guarantee of profit.
    progress = rev / break_even * 100 if rev is not None and break_even is not None and break_even > 0 else None
    emit("break_even_progress", progress, unit="percent", reason="Seuil de rentabilité positif requis.")

    operating_result = (values["operating_income"] - values["operating_expenses"]
                        if e.costs_complete and values["operating_income"] is not None and values["operating_expenses"] is not None else None)
    emit("operating_result", operating_result, reason="Produits et charges d'exploitation exhaustifs requis.")

    resources, assets = values["stable_resources"], values["stable_assets"]
    ca, cl = values["operating_current_assets"], values["operating_current_liabilities"]
    frng = resources - assets if e.balance_sheet_complete and resources is not None and assets is not None else None
    bfr = ca - cl if e.balance_sheet_complete and ca is not None and cl is not None else None
    emit("working_capital", frng, reason="Bilan complet : ressources et emplois stables requis.", sources=("verified_balance_sheet",))
    emit("working_capital_requirement", bfr, reason="Actifs et passifs circulants d'exploitation requis.")
    emit("accounting_net_cash", frng - bfr if frng is not None and bfr is not None else None, reason="FRNG et BFR déterminés requis.")

    outflow, inflow, cash = values["cash_outflows"], values["cash_inflows"], values["usable_cash"]
    burn = ((outflow - inflow) / Decimal(e.observed_days) if e.cash_flows_complete and
            e.observed_days and outflow is not None and inflow is not None else None)
    emit("daily_burn_rate", burn, reason="Historique exhaustif et période représentative requis.", sources=("verified_cash_flows",))
    runway = cash / burn if cash is not None and cash >= 0 and burn is not None and burn > 0 else None
    state = MetricStatus.NOT_APPLICABLE if burn is not None and burn <= 0 else None
    emit("cash_runway_days", runway, unit="days", reason="Trésorerie utilisable et consommation journalière positive requises.", status=state)
    return results
