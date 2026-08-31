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
        org_data = org_resp.json()
        org_id = org_data["id"]

        # 2. Check initial billing status (Trial)
        status_resp = client.get("/api/v1/billing/status", headers=OWNER_HEADERS)
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["subscription_plan"] == "trial"
        assert data["is_trial"] is True
        assert len(data["available_plans"]) >= 2

        # 3. Simulate KORYXA Payment webhook callback for Pack Business 3 Mois
        idempotency_key = f"sub-{org_id}-pack_business_3m-12345"
        webhook_resp = client.post(
            "/api/v1/billing/webhook",
            json={
                "event": "payment.successful",
                "status": "successful",
                "customer_id": org_id,
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

        # 4. Check updated billing status (Active Business with 3 senders)
        updated_status = client.get("/api/v1/billing/status", headers=OWNER_HEADERS)
        assert updated_status.status_code == 200
        updated_data = updated_status.json()
        assert updated_data["subscription_plan"] == "business"
        assert updated_data["subscription_status"] == "active"
        assert updated_data["max_authorized_senders"] >= 3
        assert updated_data["is_active"] is True

        # 5. Security & Idempotency: Replay of same webhook should NOT re-apply
        replay_resp = client.post(
            "/api/v1/billing/webhook",
            json={
                "event": "payment.successful",
                "status": "successful",
                "customer_id": org_id,
                "product_code": "pack_business_3m",
                "amount_minor": 39900,
                "currency": "XOF",
                "idempotency_key": idempotency_key,
                "payment_id": "kpx_pay_123456789",
            },
        )
        assert replay_resp.status_code == 200
        replay_data = replay_resp.json()
        assert replay_data["status"] == "already_processed"

        # 6. Security: Underpaid webhook must be rejected
        underpaid_resp = client.post(
            "/api/v1/billing/webhook",
            json={
                "event": "payment.successful",
                "status": "successful",
                "customer_id": org_id,
                "product_code": "pack_business_3m",
                "amount_minor": 500,  # Underpaid
                "currency": "XOF",
                "idempotency_key": f"sub-{org_id}-underpaid-1",
                "payment_id": "kpx_pay_underpaid_1",
            },
        )
        assert underpaid_resp.status_code == 200
        assert underpaid_resp.json()["status"] == "rejected"
