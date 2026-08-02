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


def test_validation_acceptance_applies_value_and_audits() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-workflow-a", "owner-workflow-a")
        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={"name": "Offre initiale", "price": "1000"},
        )
        assert offer.status_code == 201
        offer_id = offer.json()["id"]

        validation = client.post(
            "/api/v1/workflow/validations",
            headers=owner,
            json={
                "record_type": "offer",
                "record_id": offer_id,
                "field_name": "price",
                "old_value": "1000.00",
                "proposed_value": "1200",
                "source_type": "document",
                "source_reference": "attachment-1",
                "source_author_user_id": "owner-workflow-a",
                "confidence": 0.95,
            },
        )
        assert validation.status_code == 201
        validation_id = validation.json()["id"]

        decided = client.post(
            f"/api/v1/workflow/validations/{validation_id}/decision",
            headers=owner,
            json={
                "decision": "accepted",
                "justification": "Tarif confirmé dans le contrat signé",
            },
        )
        assert decided.status_code == 200
        assert decided.json()["status"] == "accepted"
        assert decided.json()["final_value"] == "1200"

        refreshed = client.get(
            f"/api/v1/registers/offers/{offer_id}",
            headers=owner,
        )
        assert refreshed.status_code == 200
        assert refreshed.json()["price"] == "1200.00"

        audit = client.get(
            "/api/v1/workflow/audit",
            headers=owner,
            params={"entity_type": "validation", "entity_id": validation_id},
        )
        assert audit.status_code == 200
        assert {item["event_type"] for item in audit.json()} == {
            "validation.created",
            "validation.accepted",
        }


def test_validation_rejection_does_not_change_record() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-workflow-b", "owner-workflow-b")
        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={"name": "Offre rejet", "price": "500"},
        )
        offer_id = offer.json()["id"]
        validation = client.post(
            "/api/v1/workflow/validations",
            headers=owner,
            json={
                "record_type": "offer",
                "record_id": offer_id,
                "field_name": "price",
                "old_value": "500",
                "proposed_value": "900",
                "source_type": "ai",
            },
        )
        validation_id = validation.json()["id"]
        rejected = client.post(
            f"/api/v1/workflow/validations/{validation_id}/decision",
            headers=owner,
            json={
                "decision": "rejected",
                "justification": "La source n'est pas officielle",
            },
        )
        assert rejected.status_code == 200
        refreshed = client.get(f"/api/v1/registers/offers/{offer_id}", headers=owner)
        assert refreshed.json()["price"] == "500.00"


def test_alert_to_action_completion_resolves_alert() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-workflow-c", "owner-workflow-c")
        client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={"name": "Offre sans prix", "status": "validated"},
        )
        run = client.post("/api/v1/radar/runs", headers=owner)
        assert run.status_code == 201
        alerts = client.get("/api/v1/radar/alerts", headers=owner).json()
        alert = next(item for item in alerts if item["rule_code"] == "offer.price_missing")

        action = client.post(
            "/api/v1/workflow/actions",
            headers=owner,
            json={
                "alert_id": alert["id"],
                "title": "Corriger le tarif",
                "priority": "high",
                "responsible_user_id": "owner-workflow-c",
                "due_date": "2026-08-10",
            },
        )
        assert action.status_code == 201
        action_id = action.json()["id"]
        assert action.json()["record_id"] == alert["record_id"]

        comment = client.post(
            f"/api/v1/workflow/actions/{action_id}/comments",
            headers=owner,
            json={"body": "Vérification en cours avec le responsable commercial."},
        )
        assert comment.status_code == 201

        completed = client.patch(
            f"/api/v1/workflow/actions/{action_id}",
            headers=owner,
            json={
                "status": "completed",
                "resolution_comment": "Le tarif officiel a été validé.",
                "resolution_evidence": {"document": "contrat-2026"},
            },
        )
        assert completed.status_code == 200
        assert completed.json()["status"] == "completed"
        assert completed.json()["completed_by_user_id"] == "owner-workflow-c"

        alerts_after = client.get("/api/v1/radar/alerts", headers=owner).json()
        resolved = next(item for item in alerts_after if item["id"] == alert["id"])
        assert resolved["status"] == "resolved"


def test_action_requires_resolution_evidence_and_is_tenant_isolated() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-workflow-d", "owner-workflow-d")
        other = create_org(client, "tenant-workflow-e", "owner-workflow-e")
        action = client.post(
            "/api/v1/workflow/actions",
            headers=owner,
            json={"title": "Action isolée"},
        )
        assert action.status_code == 201
        action_id = action.json()["id"]

        invalid = client.patch(
            f"/api/v1/workflow/actions/{action_id}",
            headers=owner,
            json={"status": "completed"},
        )
        assert invalid.status_code == 422

        hidden = client.patch(
            f"/api/v1/workflow/actions/{action_id}",
            headers=other,
            json={"status": "in_progress"},
        )
        assert hidden.status_code == 404

        other_actions = client.get("/api/v1/workflow/actions", headers=other)
        assert other_actions.status_code == 200
        assert other_actions.json() == []
