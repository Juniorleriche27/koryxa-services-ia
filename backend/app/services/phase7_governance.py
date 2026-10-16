"""Phase 7: tenant-safe, conservative analytical governance and organization profile.

No external URL or logo storage key is exposed in public-facing projections.
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.models.organization import Organization

# Definitions are versioned and deliberately informational: only deterministic
# metrics with an established source are registered here.
FORMULA_CATALOGUE: tuple[dict[str, Any], ...] = (
    {"code": "total_sales_amount", "version": "1", "source": "validated_sales", "unit": "money", "rule": "sum(admissible_validated_sales_total)", "period": "all_time"},
    {"code": "total_paid_amount", "version": "1", "source": "validated_sales", "unit": "money", "rule": "sum(admissible_recorded_payments)", "period": "all_time"},
    {"code": "total_unpaid_amount", "version": "1", "source": "validated_sales", "unit": "money", "rule": "sum(admissible_validated_sales_total) - sum(admissible_recorded_payments)", "period": "all_time"},
    {"code": "cash_movement_net", "version": "1", "source": "registers", "unit": "money", "rule": "sale_payments - paid_expenses", "period": "all_time"},
    {"code": "declared_cash_balance", "version": "1", "source": "cash_accounts", "unit": "money", "rule": "opening_balance + inflows - outflows", "period": "as_of"},
    {"code": "estimated_gross_margin", "version": "5.1", "source": "verified_costs", "unit": "money", "rule": "revenue - cost_of_sales", "period": "specified"},
    {"code": "break_even_point", "version": "5.1", "source": "verified_costs", "unit": "money", "rule": "fixed_costs / contribution_margin_ratio", "period": "specified"},
    {"code": "cash_runway_days", "version": "5.1", "source": "verified_cash_flows", "unit": "days", "rule": "usable_cash / positive_daily_net_burn", "period": "specified"},
    {"code": "working_capital", "version": "5.1", "source": "verified_balance_sheet", "unit": "money", "rule": "stable_resources - stable_assets", "period": "specified"},
)
FORMULA_INDEX = {f["code"]: f for f in FORMULA_CATALOGUE}


def financial_provenance(code: str, *, organization_id: str, currency: str | None, status: str) -> dict[str, Any]:
    """Explain an indicator without guessing a missing currency or source."""
    entry = FORMULA_INDEX.get(code)
    if entry is None:
        raise ValueError("Formule inconnue")
    if currency is not None and (len(currency) != 3 or not currency.isalpha() or not currency.isupper()):
        raise ValueError("Devise ISO incorrecte")
    return {
        "formula_code": code,
        "formula_version": entry["version"],
        "source_family": entry["source"],
        "organization_id": organization_id,
        "currency": currency,
        "status": status,
        "verified_at": None,
        "trace_kind": "formula_metadata_not_transaction_audit",
    }


def organization_hall_profile(organization: Organization) -> dict[str, Any]:
    """Allowlisted, tenant-bound personalization without disclosing private keys."""
    return {
        "organization_id": organization.id,
        "name": organization.name,
        "sector": organization.sector,
        "business_category": organization.business_category,
        "country": organization.country,
        "has_logo": bool(organization.logo_storage_key),
        "logo_updated_at": organization.logo_updated_at.isoformat() if organization.logo_updated_at else None,
        "onboarding_completed": organization.onboarding_completed_at is not None,
    }
