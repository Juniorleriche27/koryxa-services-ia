"""Grand Hall : projection stable des moteurs existants, sans nouveau calcul métier."""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.radar import AlertStatus, RadarAlert, RadarRun
from app.services.analytics_contract import MetricResult, MetricStatus
from app.services.financial_summary import fetch_summary
from app.services.radar_quality import radar_quality_snapshot


METRICS: dict[str, tuple[str, str]] = {
    "total_sales_amount": ("money", "registers"),
    "total_paid_amount": ("money", "registers"),
    "total_unpaid_amount": ("money", "registers"),
    "total_expenses_paid": ("money", "registers"),
    "total_expenses_unpaid": ("money", "registers"),
    "cash_movement_net": ("money", "registers"),
    "declared_cash_balance": ("money", "ledger"),
    "estimated_gross_margin": ("money", "profitability"),
    "break_even_point": ("money", "profitability"),
    "cash_runway_days": ("days", "treasury"),
    "working_capital": ("money", "balance_sheet"),
}


def build_metric_results(summary: dict[str, Any], org_id: str, *, now: datetime | None = None) -> dict[str, MetricResult]:
    """Contrat strict : aucun float ne traverse la couche de résultat monétaire."""
    now = now or datetime.now(timezone.utc)
    status = summary.get("financial_data_status")
    currency = summary.get("primary_currency")
    reasons = summary.get("financial_indicator_reasons") or {}
    results: dict[str, MetricResult] = {}
    for code, (unit, source) in METRICS.items():
        raw = summary.get(code)
        is_cash = code == "declared_cash_balance"
        problematic = status in {"mixed_currencies", "missing_currency", "incomplete_payments"}
        incompatible = (code != "declared_cash_balance" and problematic and raw is None)
        if is_cash:
            metric_currency = summary.get("declared_cash_currency")
        else:
            metric_currency = currency if not problematic else None
        value = None
        if raw is not None:
            if isinstance(raw, float) or isinstance(raw, bool):
                raise ValueError(f"Le moteur {code} a retourné un type monétaire interdit")
            value = raw if isinstance(raw, Decimal) else Decimal(str(raw))
        state = (MetricStatus.CALCULABLE if value is not None else
                 MetricStatus.INCOMPATIBLE if incompatible else MetricStatus.INCOMPLETE)
        reason = (reasons.get(code) or ("Devises ou paiements incompatibles." if incompatible else "Informations insuffisantes.")) if value is None else None
        results[code] = MetricResult(
            code=code, value=value, unit=unit, currency=metric_currency if unit == "money" else None,
            organization_id=org_id, period=summary.get("aggregation_period", "all_time"),
            status=state, reason=reason, sources=[source], calculated_at=now,
        )
    return results


async def fetch_grand_hall(session: AsyncSession, org_id: str) -> dict[str, Any]:
    summary = await fetch_summary(session, org_id)
    radar = await radar_quality_snapshot(session, org_id)
    metrics = build_metric_results(summary, org_id)
    return {
        "schema_version": "1.0",
        "organization_id": org_id,
        "generated_at": datetime.now(timezone.utc),
        "period": summary.get("aggregation_period", "all_time"),
        "metrics": {key: metric.model_dump(mode="json") for key, metric in metrics.items()},
        "radar": radar,
        "operations": {
            "sales_count": summary.get("total_sales_count", 0),
            "pending_validation_sales_count": summary.get("pending_validation_sales_count", 0),
            "offers_count": summary.get("offers_count", 0),
            "procedures_count": summary.get("procedures_count", 0),
            "suppliers_count": summary.get("suppliers_count", 0),
            "low_stock_count": summary.get("low_stock_count", 0),
            "present_employees_today_count": summary.get("present_employees_today_count", 0),
        },
        "alerts": {"open_count": sum(radar["alert_counts"].values()), "scoring_version": radar["scoring_version"]},
        "refresh": {
            "strategy": "on_demand",
            "real_time": False,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "recommended_min_interval_seconds": 60,
            "manual_refresh_supported": True,
            "invalidation_triggers": ["sale_changed", "expense_changed", "cash_movement_changed", "radar_run_completed"],
            "cache_status": "not_cached",
        },
    }
