"""Phase 6: fiscal windows, comparisons, conditional projections and isolation."""
from datetime import date
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.temporal_analytics import (
    DateWindow, compare_values, projection_scenarios, trend_signals,
)


def test_half_open_window_previous_and_leap_day():
    w = DateWindow(date(2024, 2, 28), date(2024, 3, 1))
    assert w.days == 2
    assert w.previous.end == w.start
    assert w.previous.start == date(2024, 2, 26)
    with pytest.raises(ValueError):
        DateWindow(date(2024, 1, 1), date(2024, 1, 1))


def test_comparisons_zero_denominator_and_missing():
    assert compare_values(Decimal("30"), Decimal("20"))["percent"] == "50.00"
    zero = compare_values(Decimal("30"), Decimal("0"))
    assert zero["status"] == "non_applicable"
    assert zero["delta"] == "30.00"
    assert zero["percent"] is None
    assert compare_values(None, Decimal("1"))["status"] == "incomplet"
    with pytest.raises(ValueError):
        compare_values(1.5, Decimal("10"))


def test_projections_evidence_gate_and_deterministic_scenarios():
    inputs = dict(opening_cash=Decimal("1000"), inflows=Decimal("400"),
                  outflows=Decimal("700"), observed_days=30, horizon_days=30)
    assert projection_scenarios(**inputs)["scenarios"] is None
    data = projection_scenarios(**inputs, complete=True)
    assert data["scenarios"] == {"prudent": "480.00", "central": "700.00", "favorable": "920.00"}
    assert data["method"] == "linear_observed_cash_flow_v1"
    with pytest.raises(ValueError):
        projection_scenarios(**{**inputs, "outflows": Decimal("-1")}, complete=True)


def test_trends_are_observations_not_causal_predictions():
    assert trend_signals("sales", Decimal("125"), Decimal("100"))[0]["direction"] == "up"
    assert trend_signals("sales", Decimal("70"), Decimal("100"))[0]["cause"] == "non_determinee"
    assert trend_signals("sales", Decimal("10"), Decimal("0")) == []


def test_temporal_endpoint_tenant_isolation_and_date_validation():
    with TestClient(app) as client:
        assert client.get("/api/v1/analytics/temporal?start=2026-01-01&end=2026-02-01").status_code in (401, 403, 404)
        ids = []
        for tenant in ("phase6-a", "phase6-b"):
            headers = {"X-Tenant-ID": tenant, "X-User-ID": tenant}
            made = client.post("/api/v1/organizations", headers=headers,
                               json={"name": tenant, "slug": tenant})
            assert made.status_code == 201, made.text
            ids.append(made.json()["id"])
            response = client.get("/api/v1/analytics/temporal?start=2026-01-01&end=2026-02-01", headers=headers)
            assert response.status_code == 200, response.text
            assert response.json()["organization_id"] == ids[-1]
            assert response.json()["forecast"]["status"] == "incomplet"
            bad = client.get("/api/v1/analytics/temporal?start=2026-02-01&end=2026-01-01", headers=headers)
            assert bad.status_code == 422
        assert ids[0] != ids[1]
