from fastapi.testclient import TestClient

from app.main import app


def create_org(client: TestClient, tenant: str, user: str) -> dict[str, str]:
    headers = {"X-Tenant-ID": tenant, "X-User-ID": user}
    response = client.post(
        "/api/v1/organizations",
        headers=headers,
        json={"name": tenant, "slug": tenant},
    )
    assert response.status_code == 201
    return headers


def test_radar_rules_alerts_scores_and_tenant_isolation() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-radar-a", "owner-radar-a")
        other = create_org(client, "tenant-radar-b", "owner-radar-b")

        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={
                "name": "Offre sans prix",
                "status": "validated",
            },
        )
        assert offer.status_code == 201

        sale = client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "V-RADAR-1",
                "sale_date": "2026-01-01",
                "item_label": "Service A",
                "quantity": "2",
                "unit_price": "100",
                "discount": "0",
                "total_amount": "999",
                "payment_status": "paid",
            },
        )
        assert sale.status_code == 201

        procedure = client.post(
            "/api/v1/registers/procedures",
            headers=owner,
            json={
                "title": "Procédure active",
                "status": "validated",
                "next_review_date": "2025-01-01",
                "steps": [],
            },
        )
        assert procedure.status_code == 201

        run = client.post("/api/v1/radar/runs", headers=owner)
        assert run.status_code == 201
        assert run.json()["alerts_created"] >= 5
        assert set(run.json()["scores"]) == {
            "completeness",
            "freshness",
            "consistency",
            "traceability",
        }

        alerts = client.get("/api/v1/radar/alerts", headers=owner)
        assert alerts.status_code == 200
        codes = {item["rule_code"] for item in alerts.json()}
        assert "offer.price_missing" in codes
        assert "sale.payment_method_missing" in codes
        assert "sale.amount_inconsistent" in codes
        assert "procedure.responsible_missing" in codes
        assert "procedure.review_overdue" in codes
        assert "procedure.steps_missing" in codes

        hidden = client.get("/api/v1/radar/alerts", headers=other)
        assert hidden.status_code == 200
        assert hidden.json() == []

        alert_id = alerts.json()[0]["id"]
        updated = client.patch(
            f"/api/v1/radar/alerts/{alert_id}",
            headers=owner,
            json={"status": "acknowledged"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "acknowledged"


def test_radar_rule_configuration_and_document_fact() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-radar-c", "owner-radar-c")
        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={
                "name": "Offre document",
                "price": "1000",
                "status": "validated",
            },
        )
        assert offer.status_code == 201
        offer_id = offer.json()["id"]

        configured = client.put(
            "/api/v1/radar/rules/sale.client_missing",
            headers=owner,
            json={
                "enabled": True,
                "priority": "low",
                "parameters": {"client_required": False},
            },
        )
        assert configured.status_code == 200
        assert configured.json()["parameters"]["client_required"] is False

        fact = client.post(
            "/api/v1/radar/document-facts",
            headers=owner,
            json={
                "record_type": "offer",
                "record_id": offer_id,
                "field_name": "price",
                "value": "1200",
                "confidence": 0.95,
            },
        )
        assert fact.status_code == 201

        run = client.post("/api/v1/radar/runs", headers=owner)
        assert run.status_code == 201

        alerts = client.get(
            "/api/v1/radar/alerts?dimension=consistency",
            headers=owner,
        )
        assert alerts.status_code == 200
        mismatch = [
            item for item in alerts.json() if item["rule_code"] == "offer.document_mismatch"
        ]
        assert len(mismatch) == 1
        assert mismatch[0]["confidence"] == 0.95
