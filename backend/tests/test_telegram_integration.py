from fastapi.testclient import TestClient
from app.main import app


def test_telegram_api_and_webhook_flow() -> None:
    with TestClient(app) as client:
        auth = {"X-Tenant-ID": "tenant-tg-test", "X-User-ID": "user-tg-test"}
        
        # 1. Create organization
        res_org = client.post(
            "/api/v1/organizations",
            headers=auth,
            json={"name": "Boutique Telegram Test", "slug": "tg-test"},
        )
        assert res_org.status_code == 201

        # 2. Get Telegram config & link code
        res_cfg = client.get("/api/v1/telegram/config", headers=auth)
        assert res_cfg.status_code == 200
        cfg = res_cfg.json()
        assert cfg["link_code"].startswith("link_org_")
        assert "t.me/cauri_koryxa_bot?start=" in cfg["deep_link_url"]

        link_code = cfg["link_code"]

        # 3. Simulate user sending /start link_org_... to Webhook
        user_tg_id = 9988776655
        link_payload = {
            "update_id": 1001,
            "message": {
                "message_id": 1,
                "from": {
                    "id": user_tg_id,
                    "is_bot": False,
                    "first_name": "Koffi",
                    "last_name": "Vendeur",
                    "username": "koffi_tg",
                },
                "chat": {"id": user_tg_id, "type": "private"},
                "text": f"/start {link_code}",
            },
        }

        res_hook = client.post("/api/v1/telegram/webhook", json=link_payload)
        assert res_hook.status_code == 200
        assert res_hook.json()["ok"] is True

        # 4. Verify linked users list
        res_users = client.get("/api/v1/telegram/users", headers=auth)
        assert res_users.status_code == 200
        users = res_users.json()
        assert len(users) == 1
        assert users[0]["telegram_user_id"] == str(user_tg_id)
        assert users[0]["first_name"] == "Koffi"

        # 5. Simulate sending a sale via chat
        sale_payload = {
            "update_id": 1002,
            "message": {
                "message_id": 2,
                "from": {
                    "id": user_tg_id,
                    "is_bot": False,
                    "first_name": "Koffi",
                    "username": "koffi_tg",
                },
                "chat": {"id": user_tg_id, "type": "private"},
                "text": "Vente 3 cartons savon 15000 payé espèces au client Jean",
            },
        }

        res_sale_hook = client.post("/api/v1/telegram/webhook", json=sale_payload)
        assert res_sale_hook.status_code == 200

        # 6. Verify sale in register
        res_sales = client.get("/api/v1/registers/sales", headers=auth)
        assert res_sales.status_code == 200
        sales = res_sales.json()["items"]
        assert len(sales) == 1
        assert sales[0]["client_name"] == "Jean"
        assert float(sales[0]["total_amount"]) == 15000.0
        assert sales[0]["payment_status"] == "paid"
