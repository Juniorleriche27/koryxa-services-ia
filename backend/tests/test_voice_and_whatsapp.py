from decimal import Decimal
from fastapi.testclient import TestClient

from app.main import app


def create_org(client: TestClient, tenant: str, user: str) -> dict[str, str]:
    auth = {"X-Tenant-ID": tenant, "X-User-ID": user}
    response = client.post(
        "/api/v1/organizations",
        headers=auth,
        json={"name": tenant, "slug": tenant},
    )
    assert response.status_code == 201
    return auth


def test_voice_nlp_parser_and_confirm_sale() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-voice-1", "user-voice-1")

        # 1. Parse a spoken sale phrase
        phrase = "Vente de 3 sacs de riz à 15000 FCFA pour le client M. Koffi payé par Wave"
        parse_res = client.post(
            "/api/v1/voice/parse",
            headers=owner,
            json={"transcript": phrase},
        )
        assert parse_res.status_code == 200
        data = parse_res.json()
        assert data["intent"] == "sale"
        assert data["confidence"] >= 0.70
        assert data["extracted_entities"]["client"] == "Koffi"
        assert Decimal(str(data["extracted_entities"]["amount"])) == Decimal("15000")
        assert data["extracted_entities"]["payment_method"] == "Wave"
        assert data["extracted_entities"]["payment_status"] == "paid"

        # 2. Confirm & register the sale
        candidate = data["sale"]
        confirm_res = client.post(
            "/api/v1/voice/confirm",
            headers=owner,
            json={"intent": "sale", "payload": candidate, "source": "voice"},
        )
        assert confirm_res.status_code == 201
        assert confirm_res.json()["type"] == "sale"

        # 3. Verify in registers
        sales = client.get("/api/v1/registers/sales", headers=owner)
        assert sales.status_code == 200
        assert sales.json()["total"] == 1
        assert sales.json()["items"][0]["payment_method"] == "Wave"


def test_voice_short_sale_does_not_use_amount_as_item() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-voice-short", "user-voice-short")
        response = client.post(
            "/api/v1/voice/parse",
            headers=owner,
            json={"transcript": "J'ai fait effectuer une vente de 15000 non payés"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sale"]["item_label"] == "Vente non détaillée"
        assert Decimal(data["sale"]["total_amount"]) == Decimal("15000")
        assert data["sale"]["payment_status"] == "unpaid"
        assert "non payée" in data["summary_message"]


def test_whatsapp_webhook_handshake_and_inbound_message() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-wa-1", "user-wa-1")

        # 1. Test Meta webhook verification challenge
        challenge_res = client.get(
            "/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=koryxa_secret_webhook_token&hub.challenge=test_challenge_12345"
        )
        assert challenge_res.status_code == 200
        assert challenge_res.text == "test_challenge_12345"

        # 2. Test inbound message simulation
        inbound_res = client.post(
            "/api/v1/integrations/whatsapp/webhook",
            json={
                "from": "+2250708091011",
                "text": "Vente de prestation conseil 500000 FCFA client Société Alpha payé par virement",
                "organization_id": "tenant-wa-1",
            },
        )
        assert inbound_res.status_code == 200
        res_data = inbound_res.json()
        assert res_data["status"] == "processed"
        assert "Société Alpha" in res_data["reply_message"] or "500000" in res_data["reply_message"]

        # 3. Verify recorded sale
        sales = client.get("/api/v1/registers/sales", headers=owner)
        assert sales.status_code == 200
        assert sales.json()["total"] == 1
        assert Decimal(str(sales.json()["items"][0]["total_amount"])) == Decimal("500000")
