from datetime import date
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


def test_ai_config_crud() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-ai-1", "user-ai-1")

        # 1. Get initial config
        res = client.get("/api/v1/ai/config", headers=owner)
        assert res.status_code == 200
        data = res.json()
        assert data["provider"] == "native"
        assert len(data["available_providers"]) >= 5

        # 2. Update config to Gemini
        update_res = client.put(
            "/api/v1/ai/config",
            headers=owner,
            json={
                "provider": "gemini",
                "model_name": "gemini-1.5-pro",
                "api_key": "dummy-gemini-key-12345",
                "temperature": 0.5,
            },
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["provider"] == "gemini"
        assert updated["model_name"] == "gemini-1.5-pro"
        assert updated["has_api_key"] is True


def test_ai_copilot_chat_with_financial_context() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-ai-chat-1", "user-ai-chat-1")

        # Seed 1 paid sale and 1 unpaid sale
        client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "VTE-AI-01",
                "sale_date": date.today().isoformat(),
                "item_label": "Audit Stratégique",
                "client_name": "Cabinet Alpha",
                "quantity": 1,
                "unit_price": 500000,
                "discount": 0,
                "total_amount": 500000,
                "currency": "XOF",
                "payment_status": "unpaid",
            },
        )

        # 1. Chat about cash position
        chat_res = client.post(
            "/api/v1/ai/chat",
            headers=owner,
            json={
                "messages": [
                    {"role": "user", "content": "Quelle est la situation de ma trésorerie et mes impayés ?"}
                ],
                "include_financial_context": True,
            },
        )
        assert chat_res.status_code == 200
        reply_data = chat_res.json()
        assert "Trésorerie" in reply_data["reply"] or "XOF" in reply_data["reply"]
        assert len(reply_data["suggested_actions"]) >= 1


def test_ai_payment_reminder_generation() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-ai-remind-1", "user-ai-remind-1")

        # Generate WhatsApp reminder
        remind_res = client.post(
            "/api/v1/ai/generate-payment-reminder",
            headers=owner,
            json={
                "client_name": "Société BTP Ivoire",
                "amount": 750000,
                "currency": "XOF",
                "reference": "FAC-2026-99",
                "overdue_days": 15,
                "tone": "courteous",
                "channel": "whatsapp",
            },
        )
        assert remind_res.status_code == 200
        data = remind_res.json()
        assert "Société BTP Ivoire" in data["body"]
        assert "750 000 XOF" in data["body"] or "750000" in data["body"]
        assert data["formatted_whatsapp_url"] is not None
        assert "https://api.whatsapp.com/send" in data["formatted_whatsapp_url"]


def test_ai_procedure_generation() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-ai-proc-1", "user-ai-proc-1")

        # Generate standard procedure
        proc_res = client.post(
            "/api/v1/ai/generate-procedure",
            headers=owner,
            json={
                "title": "Procédure d'inventaire physique des stocks",
                "description": "Comptage mensuel des marchandises en magasin et rapprochement d'inventaire",
                "department": "Logistique",
                "expected_steps_count": 4,
            },
        )
        assert proc_res.status_code == 200
        data = proc_res.json()
        assert data["title"] == "Procédure d'inventaire physique des stocks"
        assert len(data["steps"]) == 4
        assert data["department"] == "Logistique"
