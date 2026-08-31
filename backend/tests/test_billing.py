from typing import Any

from fastapi.testclient import TestClient

from app.main import app

OWNER_HEADERS = {
    "X-Tenant-ID": "tenant-billing-test",
    "X-User-ID": "owner-billing",
    "X-Koryxa-Source": "koryxa-admin",
}
WEBHOOK_HEADERS = {"X-Koryxa-Webhook-Secret": "test-webhook-secret"}


class GatewayResponse:
    def __init__(self, status_code: int, payload: dict[str, Any]) -> None:
        self.status_code = status_code
        self._payload = payload
        self.text = "gateway response"

    def json(self) -> dict[str, Any]:
        return self._payload


class GatewayClient:
    async def __aenter__(self) -> "GatewayClient":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def post(self, *_: object, **__: object) -> GatewayResponse:
        return GatewayResponse(
            201,
            {
                "checkout_url": "https://pay.koryxa.fr/payment/kpx_pay_123456789",
                "payment_id": "kpx_pay_123456789",
            },
        )

    async def get(self, *_: object, **__: object) -> GatewayResponse:
        return GatewayResponse(200, {"payment_status": "succeeded"})


def test_billing_status_and_checkout_flow(monkeypatch: Any) -> None:
    monkeypatch.setattr("app.services.billing.httpx.AsyncClient", lambda **_: GatewayClient())
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

        # 3. Create a real local pending transaction through the checkout endpoint.
        checkout_resp = client.post(
            "/api/v1/billing/checkout",
            headers=OWNER_HEADERS,
            json={"product_code": "pack_business_3m", "provider": "leekpay"},
        )
        assert checkout_resp.status_code == 200
        idempotency_key = checkout_resp.json()["idempotency_key"]

        # The webhook is always closed when its authentication header is absent.
        unauthenticated = client.post(
            "/api/v1/billing/webhook",
            json={"status": "successful", "payment_id": "kpx_pay_123456789"},
        )
        assert unauthenticated.status_code == 401

        # 4. Simulate an authenticated KORYXA Payment callback.
        webhook_resp = client.post(
            "/api/v1/billing/webhook",
            headers=WEBHOOK_HEADERS,
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
            headers=WEBHOOK_HEADERS,
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

        # 6. Security: an unknown payment can never create a subscription.
        underpaid_resp = client.post(
            "/api/v1/billing/webhook",
            headers=WEBHOOK_HEADERS,
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
        assert underpaid_resp.json()["reason"] == "unknown_transaction"
