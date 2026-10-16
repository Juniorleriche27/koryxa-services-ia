"""Financial formula invariants and evidence requirements, Phase 5."""
from dataclasses import replace
from decimal import Decimal

import pytest

from app.services.analytics_contract import MetricStatus
from app.services.financial_analysis import FinancialEvidence, calculate_financial_indicators


def base(**kwargs):
    return replace(FinancialEvidence(organization_id="org-5", currency="XOF", period="2026-09"), **kwargs)


def test_missing_inputs_are_not_zero_or_inferred():
    result = calculate_financial_indicators(base(revenue=Decimal("100"), cost_of_sales=Decimal("20")))
    assert result["estimated_gross_margin"].value is None
    assert result["estimated_gross_margin"].status == MetricStatus.INCOMPLETE
    assert result["break_even_point"].value is None
    assert result["working_capital"].value is None
    assert result["cash_runway_days"].value is None


def test_profitability_break_even_when_cost_perimeter_certified():
    result = calculate_financial_indicators(base(
        costs_complete=True, revenue=Decimal("1000"), cost_of_sales=Decimal("350"),
        variable_costs=Decimal("400"), fixed_costs=Decimal("300"),
        operating_income=Decimal("1000"), operating_expenses=Decimal("800"),
    ))
    assert result["estimated_gross_margin"].value == Decimal("650.00")
    assert result["gross_margin_rate"].value == Decimal("65.00")
    assert result["contribution_margin"].value == Decimal("600.00")
    assert result["break_even_point"].value == Decimal("500.00")
    assert result["break_even_progress"].value == Decimal("200.00")
    assert result["operating_result"].value == Decimal("200.00")
    assert result["break_even_point"].model_dump(mode="json")["value"] == "500.00"


def test_negative_contribution_margin_means_not_applicable():
    result = calculate_financial_indicators(base(
        costs_complete=True, revenue=Decimal("100"),
        variable_costs=Decimal("150"), fixed_costs=Decimal("30"),
    ))
    assert result["break_even_point"].status == MetricStatus.NOT_APPLICABLE
    assert result["break_even_point"].value is None


def test_balances_require_verified_complete_bilan():
    evidence = base(stable_resources=Decimal("700"), stable_assets=Decimal("400"),
                    operating_current_assets=Decimal("240"), operating_current_liabilities=Decimal("100"))
    assert calculate_financial_indicators(evidence)["working_capital"].value is None
    valid = calculate_financial_indicators(replace(evidence, balance_sheet_complete=True))
    assert valid["working_capital"].value == Decimal("300.00")
    assert valid["working_capital_requirement"].value == Decimal("140.00")
    assert valid["accounting_net_cash"].value == Decimal("160.00")


def test_runway_does_not_fabricate_infinite_days():
    e = base(cash_flows_complete=True, usable_cash=Decimal("500"), cash_outflows=Decimal("300"),
             cash_inflows=Decimal("100"), observed_days=10)
    result = calculate_financial_indicators(e)
    assert result["daily_burn_rate"].value == Decimal("20.00")
    assert result["cash_runway_days"].value == Decimal("25.00")
    no_burn = calculate_financial_indicators(replace(e, cash_inflows=Decimal("400")))
    assert no_burn["cash_runway_days"].value is None
    assert no_burn["cash_runway_days"].status == MetricStatus.NOT_APPLICABLE
    unknown = calculate_financial_indicators(replace(e, cash_flows_complete=False))
    assert unknown["cash_runway_days"].status == MetricStatus.INCOMPLETE


@pytest.mark.parametrize("field,value", [
    ("cost_of_sales", Decimal("-1")),
    ("fixed_costs", Decimal("-1")),
    ("cash_outflows", Decimal("-1")),
    ("revenue", float("nan")),
    ("observed_days", 0),
    ("observed_days", -12),
])
def test_invalid_evidence_is_rejected(field, value):
    with pytest.raises(ValueError):
        calculate_financial_indicators(base(**{field: value}))
