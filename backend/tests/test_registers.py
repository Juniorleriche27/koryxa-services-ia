from decimal import Decimal
from fastapi.testclient import TestClient

from app.main import app


def headers(tenant: str, user: str) -> dict[str, str]:
    return {"X-Tenant-ID": tenant, "X-User-ID": user}


def create_org(client: TestClient, tenant: str, user: str) -> dict[str, str]:
    auth = headers(tenant, user)
    response = client.post(
        "/api/v1/organizations",
        headers=auth,
        json={"name": tenant, "slug": tenant},
    )
    assert response.status_code == 201
    return auth


def test_offer_sale_procedure_crud_filters_history_and_tenant_isolation() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-register-a", "owner-register-a")
        other = create_org(client, "tenant-register-b", "owner-register-b")

        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={
                "name": "Formation IA",
                "category": "formation",
                "price": "350000",
                "currency": "XOF",
                "status": "validated",
            },
        )
        assert offer.status_code == 201
        offer_id = offer.json()["id"]

        filtered = client.get(
            "/api/v1/registers/offers?category=formation&status=validated",
            headers=owner,
        )
        assert filtered.status_code == 200
        assert filtered.json()["total"] == 1

        hidden = client.get(f"/api/v1/registers/offers/{offer_id}", headers=other)
        assert hidden.status_code == 404

        sale = client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "V-001",
                "sale_date": "2026-08-02",
                "client_name": "Kalo",
                "offer_id": offer_id,
                "item_label": "Formation IA",
                "quantity": "2",
                "unit_price": "350000",
                "discount": "50000",
                "payment_status": "partial",
            },
        )
        assert sale.status_code == 201
        assert sale.json()["total_amount"] == "650000.00"
        sale_id = sale.json()["id"]

        edited_sale = client.patch(
            f"/api/v1/registers/sales/{sale_id}",
            headers=owner,
            json={"reference": "V-001-B", "sale_date": "2026-08-03", "client_name": "Kalo SARL"},
        )
        assert edited_sale.status_code == 200
        assert edited_sale.json()["reference"] == "V-001-B"
        assert edited_sale.json()["sale_date"] == "2026-08-03"

        procedure = client.post(
            "/api/v1/registers/procedures",
            headers=owner,
            json={
                "title": "Accueil client",
                "department": "operations",
                "responsible_user_id": "owner-register-a",
                "steps": [
                    {"position": 2, "title": "Créer le dossier"},
                    {"position": 1, "title": "Valider le paiement"},
                ],
            },
        )
        assert procedure.status_code == 201
        procedure_id = procedure.json()["id"]
        assert [step["position"] for step in procedure.json()["steps"]] == [1, 2]

        procedures = client.get("/api/v1/registers/procedures", headers=owner)
        assert procedures.status_code == 200
        assert procedures.json()["total"] == 1
        assert [step["position"] for step in procedures.json()["items"][0]["steps"]] == [1, 2]

        updated = client.patch(
            f"/api/v1/registers/procedures/{procedure_id}",
            headers=owner,
            json={"status": "validated"},
        )
        assert updated.status_code == 200
        assert updated.json()["version"] == 2

        history = client.get(
            f"/api/v1/registers/procedure/{procedure_id}/history",
            headers=owner,
        )
        assert history.status_code == 200
        assert len(history.json()) == 2

        archived = client.post(
            f"/api/v1/registers/offer/{offer_id}/archive",
            headers=owner,
        )
        assert archived.status_code == 204


def test_procedure_step_positions_must_be_unique() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-register-c", "owner-register-c")
        response = client.post(
            "/api/v1/registers/procedures",
            headers=owner,
            json={
                "title": "Procédure invalide",
                "steps": [
                    {"position": 1, "title": "Étape A"},
                    {"position": 1, "title": "Étape B"},
                ],
            },
        )
    assert response.status_code == 422


def test_registers_summary_and_sale_payment_status_quick_update() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-register-sum", "owner-register-sum")

        client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={"name": "Pack Audit Express", "price": "150000", "currency": "XOF"},
        )
        sale_res = client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "V-SUM-1",
                "sale_date": "2026-08-08",
                "item_label": "Pack Audit Express",
                "quantity": "1",
                "unit_price": "150000",
                "discount": "0",
                "payment_status": "unpaid",
            },
        )
        assert sale_res.status_code == 201
        sale_id = sale_res.json()["id"]

        summary = client.get("/api/v1/registers/summary", headers=owner)
        assert summary.status_code == 200
        data = summary.json()
        assert data["total_sales_count"] == 1
        assert data["total_unpaid_amount"] == "150000.00"
        assert data["offers_count"] == 1

        # Quick update payment status
        patch_res = client.patch(
            f"/api/v1/registers/sales/{sale_id}/payment-status",
            headers=owner,
            json={"payment_status": "paid", "payment_method": "Wave"},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["payment_status"] == "paid"
        assert patch_res.json()["payment_method"] == "Wave"

        summary_after = client.get("/api/v1/registers/summary", headers=owner)
        assert summary_after.status_code == 200
        assert Decimal(str(summary_after.json()["total_paid_amount"])) == Decimal("150000")
        assert Decimal(str(summary_after.json()["total_unpaid_amount"])) == Decimal("0")
