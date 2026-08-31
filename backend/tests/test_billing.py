from fastapi.testclient import TestClient
from app.main import app

OWNER_HEADERS = {
    "X-Tenant-ID": "tenant-billing-test",
    "X-User-ID": "owner-billing",
    "X-Koryxa-Source": "koryxa-admin",
}


def test_billing_status_and_checkout_flow() -> None:
    with TestClient(app) as client:
        # 1. Create org
        org_resp = client.post(
            "/api/v1/organizations",
            headers=OWNER_HEADERS,
            json={"name": "Quincaillerie Moderne", "slug": "quincaillerie-moderne"},
        )
        assert org_resp.status_code == 201

        # 2. Check initial billing status (Trial)
        status_resp = client.get("/api/v1/billing/status", headers=OWNER_HEADERS)
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["subscription_plan"] == "trial"
        assert data["is_trial"] is True
        assert len(data["available_plans"]) >= 2
        assert any(p["code"] == "pack_business_3m" for p in data["available_plans"])
        assert any(p["code"] == "pack_starter_3m" for p in data["available_plans"])

        # 3. Create Checkout for Pack Business 3 Mois
        checkout_resp = client.post(
            "/api/v1/billing/checkout",
            headers=OWNER_HEADERS,
            json={
                "product_code": "pack_business_3m",
                "provider": "leekpay",
                "customer_phone": "+2250708091011",
                "customer_email": "gerant@quincaillerie.ci",
            },
        )
        assert checkout_resp.status_code == 200
        checkout_data = checkout_resp.json()
        assert "checkout_url" in checkout_data
        assert checkout_data["product_code"] == "pack_business_3m"
        assert checkout_data["amount_minor"] == 39900
        idempotency_key = checkout_data["idempotency_key"]

        # 4. Simulate KORYXA Payment webhook callback
        webhook_resp = client.post(
            "/api/v1/billing/webhook",
            json={
                "event": "payment.successful",
                "status": "successful",
                "product_code": "pack_business_3m",
                "amount_minor": 39900,
                "currency": "XOF",
                "idempotency_key": idempotency_key,
                "payment_id": "kpx_pay_123456789",
            },
        )
        assert webhook_resp.status_code == 200
        webhook_data = webhook_resp.json()
        assert webhook_data["status"] == "success"
        assert webhook_data["plan"] == "business"

        # 5. Check updated billing status (Active Business with 3 senders)
        updated_status = client.get("/api/v1/billing/status", headers=OWNER_HEADERS)
        assert updated_status.status_code == 200
        updated_data = updated_status.json()
        assert updated_data["subscription_plan"] == "business"
        assert updated_data["subscription_status"] == "active"
        assert updated_data["max_authorized_senders"] >= 3
        assert updated_data["is_active"] is True
