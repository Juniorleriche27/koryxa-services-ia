from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app


def test_commercial_cycle_full_flow() -> None:
    with TestClient(app) as client:
        # Create organization
        auth = {"X-Tenant-ID": "tenant-cycle-test", "X-User-ID": "user-cycle-test"}
        res_org = client.post(
            "/api/v1/organizations",
            headers=auth,
            json={"name": "Entreprise Commerciale Test", "slug": "cycle-test"},
        )
        assert res_org.status_code == 201

        # 1. Test Auto-reference generation endpoint
        gen_res = client.get("/api/v1/registers/generate-reference?type=quote", headers=auth)
        assert gen_res.status_code == 200
        ref_data = gen_res.json()
        assert ref_data["reference"].startswith("DEV-")

        # 2. Create a Quote (Devis) without manual reference (auto-generated)
        quote_payload = {
            "document_type": "quote",
            "sale_date": str(date.today()),
            "client_name": "Société Alpha Construction",
            "item_label": "Prestation d'ingénierie et étude de sol",
            "quantity": 1,
            "unit_price": 500000,
            "currency": "XOF",
            "due_date": str(date.today() + timedelta(days=30)),
        }
        res_quote = client.post("/api/v1/registers/sales", json=quote_payload, headers=auth)
        assert res_quote.status_code == 201
        quote = res_quote.json()
        assert quote["document_type"] == "quote"
        assert quote["reference"].startswith("DEV-")
        assert Decimal(str(quote["total_amount"])) == Decimal("500000.00")
        assert Decimal(str(quote["paid_amount"])) == Decimal("0.00")
        assert quote["payment_status"] == "unpaid"

        # 3. Convert Quote to Official Invoice (FAC)
        convert_payload = {
            "target_type": "invoice",
            "due_date": str(date.today() + timedelta(days=15)),
        }
        res_convert = client.post(
            f"/api/v1/registers/sales/{quote['id']}/convert", json=convert_payload, headers=auth
        )
        assert res_convert.status_code == 200
        invoice = res_convert.json()
        assert invoice["document_type"] == "invoice"
        assert invoice["reference"].startswith("FAC-")

        # 4. Record Partial Deposit (Acompte 30% = 150 000 XOF)
        payment_payload_1 = {
            "amount": 150000,
            "payment_method": "Virement bancaire",
            "payment_date": str(date.today()),
            "comment": "Acompte initial de 30% à la signature",
        }
        res_pay_1 = client.post(
            f"/api/v1/registers/sales/{invoice['id']}/record-payment",
            json=payment_payload_1,
            headers=auth,
        )
        assert res_pay_1.status_code == 200
        partial_sale = res_pay_1.json()
        assert partial_sale["payment_status"] == "partial"
        assert Decimal(str(partial_sale["paid_amount"])) == Decimal("150000.00")
        assert len(partial_sale["payment_history"]) == 1

        # 5. Test AI Reminder for the remaining balance (350 000 XOF)
        reminder_payload = {
            "sale_id": partial_sale["id"],
            "client_name": "Société Alpha Construction",
            "amount": 500000,
            "paid_amount": 150000,
            "balance_due": 350000,
            "reference": partial_sale["reference"],
            "due_status": "upcoming",
            "due_date": str(date.today() + timedelta(days=5)),
            "tone": "courteous",
            "channel": "whatsapp",
        }
        res_reminder = client.post(
            "/api/v1/ai/generate-payment-reminder", json=reminder_payload, headers=auth
        )
        assert res_reminder.status_code == 200
        reminder_data = res_reminder.json()
        assert "350 000 XOF" in reminder_data["body"] or "350000" in reminder_data["body"]

        # 6. Record Settlement of the remaining balance (350 000 XOF)
        payment_payload_2 = {
            "amount": 350000,
            "payment_method": "Wave",
            "payment_date": str(date.today()),
            "comment": "Règlement final du solde",
        }
        res_pay_2 = client.post(
            f"/api/v1/registers/sales/{invoice['id']}/record-payment",
            json=payment_payload_2,
            headers=auth,
        )
        assert res_pay_2.status_code == 200
        final_sale = res_pay_2.json()
        assert final_sale["payment_status"] == "paid"
        assert Decimal(str(final_sale["paid_amount"])) == Decimal("500000.00")
        assert final_sale["document_type"] == "receipt"
        assert len(final_sale["payment_history"]) == 2
