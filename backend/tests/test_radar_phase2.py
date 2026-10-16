"""Radar phase 2 regression: replay, lifecycle, coverage, and tenant boundaries."""
from fastapi.testclient import TestClient

from app.main import app
from app.services.radar_scoring import radar_quality_score


def org(client, tenant):
    headers = {"X-Tenant-ID": tenant, "X-User-ID": f"owner-{tenant}"}
    response = client.post("/api/v1/organizations", headers=headers, json={"name": tenant, "slug": tenant})
    assert response.status_code == 201, response.text
    return headers


def test_radar_audit_is_not_certified_without_run():
    data = radar_quality_score([], audited=False)
    assert data["audit_status"] == "not_executed"
    assert data["quality_certified"] is False
    assert radar_quality_score(["freshness"] * 30)["alert_counts"]["freshness"] == 30


def test_radar_replay_keeps_alert_identity_and_acknowledged_state():
    with TestClient(app) as client:
        owner = org(client, "phase2-radar-a")
        other = org(client, "phase2-radar-b")
        offer = client.post("/api/v1/registers/offers", headers=owner,
                            json={"name": "Sans prix", "status": "validated"})
        assert offer.status_code == 201, offer.text
        first = client.post("/api/v1/radar/runs", headers=owner)
        assert first.status_code == 201, first.text
        alerts = client.get("/api/v1/radar/alerts", headers=owner).json()
        target = next(a for a in alerts if a["rule_code"] == "offer.price_missing")
        ident = target["id"]
        ack = client.patch(f"/api/v1/radar/alerts/{ident}", headers=owner,
                           json={"status": "acknowledged"})
        assert ack.status_code == 200, ack.text
        denied = client.patch(f"/api/v1/radar/alerts/{ident}", headers=other,
                              json={"status": "resolved"})
        assert denied.status_code == 404
        again = client.post("/api/v1/radar/runs", headers=owner)
        assert again.status_code == 201, again.text
        assert again.json()["alerts_created"] == 0
        updated = client.get("/api/v1/radar/alerts", headers=owner).json()
        assert next(a for a in updated if a["id"] == ident)["status"] == "acknowledged"
        assert len(updated) == len(alerts)
        run_score = again.json()["scores"]
        score = client.get("/api/v1/dashboard", headers=owner).json()["summary"]["radar_quality"]
        assert run_score == score["dimensions"]
        assert score["audit_status"] == "executed"
        resolved = client.patch(f"/api/v1/radar/alerts/{ident}", headers=owner,
                                json={"status": "resolved"})
        assert resolved.status_code == 200, resolved.text
        third = client.post("/api/v1/radar/runs", headers=owner)
        assert third.status_code == 201
        reopened = client.get("/api/v1/radar/alerts", headers=owner).json()
        assert next(a for a in reopened if a["id"] == ident)["status"] == "open"
        assert len(reopened) == len(alerts)
