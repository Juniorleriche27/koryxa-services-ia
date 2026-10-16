"""Phase 3: read permission for chat must never implicitly grant ledger writes."""
from fastapi.testclient import TestClient

from app.main import app


def test_cora_chat_sale_and_expense_intents_have_no_side_effects():
    headers = {"X-Tenant-ID": "cora-phase3", "X-User-ID": "cora-phase3-owner"}
    with TestClient(app) as client:
        organization = client.post("/api/v1/organizations", headers=headers,
            json={"name": "Cora Phase 3", "slug": "cora-phase3"})
        assert organization.status_code == 201, organization.text
        start_sales = client.get("/api/v1/registers/sales", headers=headers)
        start_expenses = client.get("/api/v1/registers/expenses", headers=headers)
        assert start_sales.status_code == 200
        assert start_expenses.status_code == 200
        for message, path in [
            ("Enregistre une vente de 25000 XOF au client Alpha", "/espace/ventes"),
            ("Enregistre une dépense de 15000 XOF de transport", "/espace/depenses"),
        ]:
            response = client.post("/api/v1/ai/chat", headers=headers,
                json={"messages": [{"role": "user", "content": message}]})
            assert response.status_code == 200, response.text
            body = response.json()
            assert body["action_executed"] is None
            assert "Aucune écriture n'a été créée" in body["reply"]
            assert any(a["payload"].get("path") == path for a in body["suggested_actions"])
        assert client.get("/api/v1/registers/sales", headers=headers).json() == start_sales.json()
        assert client.get("/api/v1/registers/expenses", headers=headers).json() == start_expenses.json()
