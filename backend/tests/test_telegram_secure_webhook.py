"""Real API-level tests: per-bot webhook auth, tenant isolation and replay control."""
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.api.routes.telegram import service


def _org(client, name):
    headers = {"X-Tenant-ID": name, "X-User-ID": f"owner-{name}"}
    result = client.post("/api/v1/organizations", headers=headers,
                         json={"name": name, "slug": name})
    assert result.status_code == 201, result.text
    return headers, result.json()["id"]


def test_custom_bot_secret_replay_tenant_and_legacy_fail_closed():
    with TestClient(app) as client:
        alpha, org_a = _org(client, "secure-tg-a")
        beta, org_b = _org(client, "secure-tg-b")
        assert org_a != org_b
        with patch.object(service, "get_me", new_callable=AsyncMock) as me, \
             patch.object(service, "set_webhook", new_callable=AsyncMock) as setup, \
             patch.object(service, "send_message", new_callable=AsyncMock) as send:
            me.return_value = {"ok": True, "result": {"username": "secure_test_bot"}}
            setup.return_value = {"ok": True}
            result = client.post("/api/v1/telegram/custom-bot", headers=alpha,
                                 json={"bot_token": "test-bot-token-not-a-real-secret"})
            assert result.status_code == 200, result.text
            url, secret = setup.await_args.args[1:]
            assert "/webhook/" in url and "org_id=" not in url
            assert secret and len(secret) == 64
            path = url[url.index("/api/v1/"):]
            cfg = client.get("/api/v1/telegram/config", headers=alpha)
            assert cfg.status_code == 200
            assert cfg.json()["custom_bot_active"] is True
            assert "secure_test_bot" in cfg.json()["deep_link_url"]
            assert "test-bot-token-not-a-real-secret" not in str(cfg.json())

            payload = {"update_id": 91001, "message": {"message_id": 91001,
                "from": {"id": 882299}, "chat": {"id": 882299, "type": "private"},
                "text": "Bilan"}}
            assert client.post(path, json=payload).status_code == 403
            assert client.post(path, json=payload, headers={"X-Telegram-Bot-Api-Secret-Token": "wrong"}).status_code == 403
            assert client.post("/api/v1/telegram/webhook?org_id=" + org_a, json=payload,
                               headers={"X-Telegram-Bot-Api-Secret-Token": secret}).status_code == 403
            auth = {"X-Telegram-Bot-Api-Secret-Token": secret}
            valid = client.post(path, json=payload, headers=auth)
            assert valid.status_code == 200, valid.text
            assert valid.json() == {"ok": True}
            replay = client.post(path, json=payload, headers=auth)
            assert replay.status_code == 200, replay.text
            assert replay.json()["duplicate"] is True
            assert send.await_count == 1

            # A valid signed update cannot link a tenant B code to bot A.
            other_link = client.get("/api/v1/telegram/config", headers=beta).json()["link_code"]
            forged = {"update_id": 91002, "message": {"message_id": 91002,
                "from": {"id": 882299}, "chat": {"id": 882299, "type": "private"},
                "text": f"/start {other_link}"}}
            assert client.post(path, json=forged, headers=auth).status_code == 200
            assert client.get("/api/v1/telegram/users", headers=beta).json() == []
            assert client.get("/api/v1/telegram/users", headers=alpha).json() == []
            assert client.get("/api/v1/registers/sales", headers=alpha).json()["items"] == []


def test_custom_bot_rejected_by_telegram_does_not_activate_webhook():
    with TestClient(app) as client:
        headers, _ = _org(client, "secure-tg-failed")
        with patch.object(service, "get_me", new_callable=AsyncMock) as me, \
             patch.object(service, "set_webhook", new_callable=AsyncMock) as setup:
            me.return_value = {"ok": True, "result": {"username": "secure_test_bot"}}
            setup.return_value = {"ok": False}
            result = client.post("/api/v1/telegram/custom-bot", headers=headers,
                                 json={"bot_token": "test-bot-token-not-a-real-secret"})
            assert result.status_code == 400
            cfg = client.get("/api/v1/telegram/config", headers=headers)
            assert cfg.json()["custom_bot_active"] is False
