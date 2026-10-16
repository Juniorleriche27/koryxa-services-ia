"""Security regression: public Telegram payloads cannot impersonate a tenant."""
from fastapi.testclient import TestClient
from app.main import app


def test_telegram_webhook_fail_closed_no_unauthorized_writes() -> None:
    with TestClient(app) as client:
        auth = {"X-Tenant-ID": "tenant-tg-test", "X-User-ID": "user-tg-test"}
        org = client.post("/api/v1/organizations", headers=auth,
                          json={"name": "Boutique Telegram Test", "slug": "tg-test"})
        assert org.status_code == 201, org.text
        org_id = org.json()["id"]
        before = client.get("/api/v1/registers/sales", headers=auth)
        assert before.status_code == 200
        for update_id in (1001, 1002):
            payload = {"update_id": update_id, "message": {
                "message_id": update_id, "from": {"id": 9988776655},
                "chat": {"id": 9988776655, "type": "private"},
                "text": "Vente 3 cartons savon 15000 payé espèces au client Jean",
            }}
            for route in ("/api/v1/telegram/webhook", f"/api/v1/telegram/webhook?org_id={org_id}"):
                result = client.post(route, json=payload)
                assert result.status_code == 403
        after = client.get("/api/v1/registers/sales", headers=auth)
        assert after.status_code == 200
        assert after.json() == before.json()
