from datetime import date, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient

from app.main import app


def test_daily_digest_and_unpaid_reminders_automations() -> None:
    with TestClient(app) as client:
        auth = {"X-Tenant-ID": "tenant-n8n-auto", "X-User-ID": "user-n8n-auto"}
        org_resp = client.post(
            "/api/v1/organizations",
            headers=auth,
            json={"name": "Entreprise N8N Auto", "slug": "tenant-n8n-auto"},
        )
        assert org_resp.status_code == 201

        # 1. Create a sale for today
        today = date.today()
        sale_resp = client.post(
            "/api/v1/registers/sales",
            headers=auth,
            json={
                "reference": "VTE-TEST-AUTO-01",
                "sale_date": today.isoformat(),
                "item_label": "Prestation Consulting",
                "quantity": "1",
                "unit_price": "50000",
                "total_amount": "50000",
                "currency": "XOF",
                "payment_method": "Wave",
                "payment_status": "paid",
            },
        )
        assert sale_resp.status_code == 201

        # 2. Create an overdue unpaid sale
        past_date = today - timedelta(days=5)
        unpaid_resp = client.post(
            "/api/v1/registers/sales",
            headers=auth,
            json={
                "reference": "VTE-TEST-UNPAID-01",
                "sale_date": past_date.isoformat(),
                "client_name": "Entreprise Kouassi SARL",
                "item_label": "Marchandises en gros",
                "quantity": "2",
                "unit_price": "75000",
                "total_amount": "150000",
                "currency": "XOF",
                "payment_method": "Virement",
                "payment_status": "unpaid",
            },
        )
        assert unpaid_resp.status_code == 201

        # 3. Test GET /api/v1/automations/daily-digest
        digest_resp = client.get(
            "/api/v1/automations/daily-digest",
            headers=auth,
        )
        assert digest_resp.status_code == 200
        digest = digest_resp.json()
        assert digest["sales"]["sales_count"] >= 1
        assert "BILAN JOURNALIER" in digest["formatted_message"]
        assert "Wave" in digest["formatted_message"] or "Prestation" in str(digest)

        # 4. Test POST /api/v1/automations/daily-digest/send
        send_digest_resp = client.post(
            "/api/v1/automations/daily-digest/send",
            headers=auth,
        )
        assert send_digest_resp.status_code == 200
        assert send_digest_resp.json()["success"] is True

        # 5. Test GET /api/v1/automations/unpaid-reminders
        reminders_resp = client.get(
            "/api/v1/automations/unpaid-reminders?min_days=2",
            headers=auth,
        )
        assert reminders_resp.status_code == 200
        reminders_data = reminders_resp.json()
        assert reminders_data["total_unpaid_count"] >= 1
        found_unpaid = any(r["reference"] == "VTE-TEST-UNPAID-01" for r in reminders_data["reminders"])
        assert found_unpaid is True

        # 6. Test POST /api/v1/automations/unpaid-reminders/send
        send_reminders_resp = client.post(
            "/api/v1/automations/unpaid-reminders/send?min_days=2",
            headers=auth,
        )
        assert send_reminders_resp.status_code == 200
        assert send_reminders_resp.json()["success"] is True
