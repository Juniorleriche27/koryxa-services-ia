from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app
from app.services.whatsapp import normalize_e164


def create_org_and_get_id(client: TestClient, tenant_id: str, user_id: str, name: str = "Test Org") -> tuple[dict[str, str], str]:
    headers = {
        "X-Tenant-ID": tenant_id,
        "X-User-ID": user_id,
    }
    create_res = client.post("/api/v1/organizations", headers=headers, json={"name": name, "slug": tenant_id})
    assert create_res.status_code == 201
    org_res = client.get("/api/v1/organizations/current", headers=headers)
    assert org_res.status_code == 200
    return headers, org_res.json()["id"]


def test_e164_normalization() -> None:
    assert normalize_e164("+225 07 08 09 10 11") == "+2250708091011"
    assert normalize_e164("002250708091011") == "+2250708091011"
    assert normalize_e164("2250708091011@s.whatsapp.net") == "+2250708091011"
    assert normalize_e164("2250708091011@c.us") == "+2250708091011"
    assert normalize_e164("2250708091011@lid") == "+2250708091011"
    assert normalize_e164("+33.6.12.34.56.78") == "+33612345678"


def test_authorized_numbers_crud_and_tenant_isolation() -> None:
    with TestClient(app) as client:
        headers_a, org_a_id = create_org_and_get_id(client, "tenant-auth-a", "user-auth-a", "Société A")
        headers_b, org_b_id = create_org_and_get_id(client, "tenant-auth-b", "user-auth-b", "Société B")

        # 1. Add authorized number in Org A
        add_res = client.post(
            "/api/v1/integrations/whatsapp/authorized-numbers",
            headers=headers_a,
            json={
                "phone_number": "+225 07 08 09 10 11",
                "whatsapp_lid": "12345678901234@lid",
                "label": "Koffi Commercial",
                "is_active": True,
            },
        )
        assert add_res.status_code == 201
        data_a = add_res.json()
        assert data_a["phone_number"] == "+2250708091011"
        assert data_a["whatsapp_lid"] == "12345678901234"
        assert data_a["label"] == "Koffi Commercial"
        assert data_a["is_active"] is True
        sender_id = data_a["id"]

        # 2. Refuse duplicate phone number in Org A
        dup_res = client.post(
            "/api/v1/integrations/whatsapp/authorized-numbers",
            headers=headers_a,
            json={"phone_number": "2250708091011@s.whatsapp.net", "label": "Autre Nom"},
        )
        assert dup_res.status_code == 409

        # 3. List in Org A vs Org B (Tenant Isolation)
        list_a = client.get("/api/v1/integrations/whatsapp/authorized-numbers", headers=headers_a).json()
        assert list_a["total"] == 1
        assert list_a["items"][0]["phone_number"] == "+2250708091011"
        assert list_a["items"][0]["whatsapp_lid"] == "12345678901234"

        list_b = client.get("/api/v1/integrations/whatsapp/authorized-numbers", headers=headers_b).json()
        assert list_b["total"] == 0

        # 4. Org B cannot update or delete Org A's sender
        update_b = client.patch(
            f"/api/v1/integrations/whatsapp/authorized-numbers/{sender_id}",
            headers=headers_b,
            json={"label": "Piraté"},
        )
        assert update_b.status_code == 404

        # 5. Org A can update label, lid and toggle is_active
        update_a = client.patch(
            f"/api/v1/integrations/whatsapp/authorized-numbers/{sender_id}",
            headers=headers_a,
            json={"label": "Koffi Responsable Ventes", "whatsapp_lid": "999888777@lid", "is_active": False},
        )
        assert update_a.status_code == 200
        assert update_a.json()["is_active"] is False
        assert update_a.json()["label"] == "Koffi Responsable Ventes"
        assert update_a.json()["whatsapp_lid"] == "999888777"

        # 6. Re-enable
        client.patch(
            f"/api/v1/integrations/whatsapp/authorized-numbers/{sender_id}",
            headers=headers_a,
            json={"is_active": True},
        )


def test_closed_by_default_zero_trust_when_no_senders_configured() -> None:
    """Vérifie que lorsqu'aucun numéro n'est configuré (0 configuré), TOUT message entrant est rejeté."""
    with TestClient(app) as client:
        headers, org_id = create_org_and_get_id(client, "tenant-zero-trust", "user-zero-trust", "Zero Trust Org")

        # Aucune liste de numéros autorisés configurée pour cette organisation
        unauth_msg = {
            "from": "+2250708091011@s.whatsapp.net",
            "text": "Vente de 10 sacs de ciment à 50000 FCFA client Diarra",
            "organization_id": org_id,
        }
        res = client.post(
            "/api/v1/integrations/whatsapp/webhook",
            headers={"X-Koryxa-Proxy-Secret": "service-ia-development-only-proxy-secret"},
            json=unauth_msg,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "unauthorized_sender"
        assert "pas autorisé" in data["reply_message"]

        # ZERO vente créée
        sales = client.get("/api/v1/registers/sales", headers=headers).json()
        assert sales["total"] == 0


def test_authorized_sender_vs_unauthorized_sender_execution() -> None:
    with TestClient(app) as client:
        headers, org_id = create_org_and_get_id(client, "tenant-senders-flow", "user-senders-flow", "Entreprise Flow")

        # Configure an authorized sender
        auth_phone = "+2250102030405"
        client.post(
            "/api/v1/integrations/whatsapp/authorized-numbers",
            headers=headers,
            json={"phone_number": auth_phone, "label": "Vendeur Officiel"},
        )

        # Count sales initially
        sales_before = client.get("/api/v1/registers/sales", headers=headers).json()
        count_before = sales_before["total"]

        # CASE 1: Unauthorized sender attempts to record a sale
        unauthorized_phone = "+2259999999999"
        unauth_msg = {
            "from": f"{unauthorized_phone}@s.whatsapp.net",
            "text": "Vente de 5 climatiseurs à 250000 FCFA client M. Inconnu payé par Wave",
            "organization_id": org_id,
        }
        res_unauth = client.post(
            "/api/v1/integrations/whatsapp/webhook",
            headers={"X-Koryxa-Proxy-Secret": "service-ia-development-only-proxy-secret"},
            json=unauth_msg,
        )
        assert res_unauth.status_code == 200
        unauth_data = res_unauth.json()
        assert unauth_data["status"] == "unauthorized_sender"
        assert "pas autorisé" in unauth_data["reply_message"]

        # VERIFY: Absolutely NO sale was created in the database!
        sales_after_unauth = client.get("/api/v1/registers/sales", headers=headers).json()
        assert sales_after_unauth["total"] == count_before

        # CASE 2: Authorized sender records the sale
        auth_msg = {
            "from": f"{auth_phone}@s.whatsapp.net",
            "text": "Vente de 5 climatiseurs à 250000 FCFA client M. Legitime payé par Wave",
            "organization_id": org_id,
        }
        res_auth = client.post(
            "/api/v1/integrations/whatsapp/webhook",
            headers={"X-Koryxa-Proxy-Secret": "service-ia-development-only-proxy-secret"},
            json=auth_msg,
        )
        assert res_auth.status_code == 200
        auth_data = res_auth.json()
        assert auth_data["status"] == "processed"
        assert "Vente enregistrée avec succès" in auth_data["reply_message"]

        # VERIFY: Exactly 1 new sale was created in the database!
        sales_after_auth = client.get("/api/v1/registers/sales", headers=headers).json()
        assert sales_after_auth["total"] == count_before + 1


def test_whatsapp_lid_sender_authorization() -> None:
    """Vérifie l'autorisation par identifiant LID WhatsApp."""
    with TestClient(app) as client:
        headers, org_id = create_org_and_get_id(client, "tenant-lid-flow", "user-lid-flow", "LID Flow Org")

        # Inscrire un collaborateur par son LID
        lid_val = "109827364512938"
        client.post(
            "/api/v1/integrations/whatsapp/authorized-numbers",
            headers=headers,
            json={
                "phone_number": "+2250808080808",
                "whatsapp_lid": f"{lid_val}@lid",
                "label": "Collaborateur LID",
            },
        )

        # Message provenant du LID avec from anonyme / LID
        lid_msg = {
            "from": f"{lid_val}@lid",
            "sender_lid": lid_val,
            "text": "Vente de 2 ventilateurs à 30000 FCFA client Touré payé par Orange Money",
            "organization_id": org_id,
        }
        res = client.post(
            "/api/v1/integrations/whatsapp/webhook",
            headers={"X-Koryxa-Proxy-Secret": "service-ia-development-only-proxy-secret"},
            json=lid_msg,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "processed"
        assert "Vente enregistrée avec succès" in data["reply_message"]

        sales = client.get("/api/v1/registers/sales", headers=headers).json()
        assert sales["total"] == 1


def test_whatsapp_session_alert_endpoint() -> None:
    """Vérifie le traitement sans erreur de l'endpoint d'alerte de session."""
    with TestClient(app) as client:
        payload = {
            "organization_id": "47160127-4827-4859-9085-c0e7bfaf34e0",
            "event": "whatsapp_session_reconnecting",
            "details": {"statusCode": 408, "reason": "QR timeout"},
        }
        # 1. Non authentifié -> 401
        res_unauth = client.post(
            "/api/v1/integrations/whatsapp/session-alert",
            json=payload,
        )
        assert res_unauth.status_code == 401

        # 2. Authentifié avec proxy secret -> 200
        res = client.post(
            "/api/v1/integrations/whatsapp/session-alert",
            headers={"X-Koryxa-Proxy-Secret": "service-ia-development-only-proxy-secret"},
            json=payload,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "recorded"
        assert data["alert_event"] == "whatsapp_session_reconnecting"

