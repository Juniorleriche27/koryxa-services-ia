"""Phase 1: contrat analytique strict et Grand Hall isolé par organisation."""
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.services.analytics_contract import MetricResult, MetricStatus, exact_decimal, round_money
from app.services.grand_hall import build_metric_results


def test_decimal_contract_rejects_floats_and_non_finite_values():
    assert exact_decimal("100.35") == Decimal("100.35")
    assert round_money(Decimal("1.235")) == Decimal("1.24")
    for value in [0.1, float("nan"), "NaN", "Infinity", True]:
        with pytest.raises(ValueError):
            exact_decimal(value)


def test_metric_contract_requires_consistent_status_and_value():
    common = dict(code="sales", unit="money", organization_id="tenant")
    with pytest.raises(ValidationError):
        MetricResult(**common, value=None, status=MetricStatus.CALCULABLE)
    with pytest.raises(ValidationError):
        MetricResult(**common, value=Decimal("5"), status=MetricStatus.INCOMPLETE)
    assert MetricResult(**common, value=Decimal("0"), status=MetricStatus.CALCULABLE).value == 0


def test_grand_hall_projection_keeps_zero_vs_unknown():
    metrics = build_metric_results({
        "total_sales_amount": Decimal("0"), "estimated_gross_margin": None,
        "financial_indicator_reasons": {"estimated_gross_margin": "Coûts manquants"},
        "primary_currency": "XOF", "aggregation_period": "all_time",
    }, "org-a")
    assert metrics["total_sales_amount"].status == MetricStatus.CALCULABLE
    assert metrics["total_sales_amount"].value == 0
    assert metrics["estimated_gross_margin"].status == MetricStatus.INCOMPLETE
    assert metrics["estimated_gross_margin"].reason == "Coûts manquants"
    assert metrics["total_sales_amount"].model_dump(mode="json")["value"] == "0"
    with pytest.raises(ValueError):
        build_metric_results({"total_sales_amount": 3.14}, "org-a")


def test_grand_hall_endpoint_is_tenant_scoped_and_versioned():
    with TestClient(app) as client:
        alpha = {"X-Tenant-ID": "grand-hall-a", "X-User-ID": "grand-hall-user-a"}
        bravo = {"X-Tenant-ID": "grand-hall-b", "X-User-ID": "grand-hall-user-b"}
        ids = []
        for headers, name in [(alpha, "Company A"), (bravo, "Company B")]:
            created = client.post("/api/v1/organizations", headers=headers, json={"name": name, "slug": name.lower().replace(" ", "-")})
            assert created.status_code == 201, created.text
            ids.append(created.json()["id"])
        results = [client.get("/api/v1/grand-hall", headers=h) for h in (alpha, bravo)]
        for response, expected in zip(results, ids):
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["organization_id"] == expected
            assert body["schema_version"] == "1.0"
            assert body["metrics"]["estimated_gross_margin"]["status"] == "incomplet"
            assert body["metrics"]["estimated_gross_margin"]["value"] is None
            assert body["radar"]["metric_type"] == "data_quality_alerts"
            assert body["refresh"]["real_time"] is False
        assert client.get("/api/v1/grand-hall").status_code in (401, 403, 404)
