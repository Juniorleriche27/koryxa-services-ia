from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app


def test_smart_documents_lifecycle_and_payment():
    with TestClient(app) as client:
        # Create organization
        auth = {"X-Tenant-ID": "tenant-smartdoc-test", "X-User-ID": "user-smartdoc-test"}
        res_org = client.post(
            "/api/v1/organizations",
            headers=auth,
            json={"name": "Entreprise Cauri Innov", "slug": "cauri-innov-test"},
        )
        assert res_org.status_code == 201

        # 1. Create a Quote (Devis)
        quote_payload = {
            "document_type": "quote",
            "sale_date": str(date.today()),
            "client_name": "Société Ouest Informatique",
            "client_phone": "+2250700112233",
            "item_label": "Déploiement Système CAURI & Formation",
            "quantity": 1,
            "unit_price": 300000,
            "currency": "XOF",
            "due_date": str(date.today() + timedelta(days=15)),
        }
        res_quote = client.post("/api/v1/registers/sales", json=quote_payload, headers=auth)
        assert res_quote.status_code == 201
        quote_data = res_quote.json()
        assert quote_data["document_type"] == "quote"
        public_token = quote_data.get("public_token")
        assert public_token is not None
        assert public_token.startswith("doc_")

        # 2. Public view access (without any auth headers!)
        res_public = client.get(f"/api/v1/public/documents/{public_token}")
        assert res_public.status_code == 200
        pub_data = res_public.json()
        assert pub_data["reference"] == quote_data["reference"]
        assert pub_data["client_name"] == "Société Ouest Informatique"
        assert Decimal(str(pub_data["total_amount"])) == Decimal("300000.00")
        assert Decimal(str(pub_data["remaining_balance"])) == Decimal("300000.00")
        assert pub_data["view_count"] == 1
        assert pub_data["last_viewed_at"] is not None

        # Viewing again increments view count
        res_public_2 = client.get(f"/api/v1/public/documents/{public_token}")
        assert res_public_2.status_code == 200
        assert res_public_2.json()["view_count"] == 2

        # 3. Tactile electronic signature
        sign_payload = {
            "signer_name": "M. Amadou Traoré (Directeur Général)",
            "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        }
        res_sign = client.post(f"/api/v1/public/documents/{public_token}/sign", json=sign_payload)
        assert res_sign.status_code == 200
        signed_doc = res_sign.json()
        assert signed_doc["signed_by_name"] == "M. Amadou Traoré (Directeur Général)"
        assert signed_doc["signed_at"] is not None
        assert signed_doc["signature_data"].startswith("data:image/png;base64")

        # 4. Instant 1-Click Mobile Money Payment (Wave deposit of 100 000 XOF)
        pay_payload_1 = {
            "amount": 100000,
            "payment_method": "wave",
            "client_phone": "+2250700112233",
            "payer_name": "Amadou Traoré",
        }
        res_pay_1 = client.post(f"/api/v1/public/documents/{public_token}/pay", json=pay_payload_1)
        assert res_pay_1.status_code == 200
        pay_res_1 = res_pay_1.json()
        assert pay_res_1["success"] is True
        assert pay_res_1["transaction_id"].startswith("PAY-")
        doc_after_pay_1 = pay_res_1["document"]
        assert Decimal(str(doc_after_pay_1["paid_amount"])) == Decimal("100000.00")
        assert Decimal(str(doc_after_pay_1["remaining_balance"])) == Decimal("200000.00")
        assert doc_after_pay_1["payment_status"] == "partial"
        assert len(doc_after_pay_1["payment_history"]) == 1
        assert doc_after_pay_1["payment_history"][0]["method"] == "WAVE"

        # 5. Full settlement of remaining balance (200 000 XOF via Orange Money)
        pay_payload_2 = {
            "amount": 200000,
            "payment_method": "orange_money",
            "client_phone": "+2250700112233",
            "payer_name": "Amadou Traoré",
        }
        res_pay_2 = client.post(f"/api/v1/public/documents/{public_token}/pay", json=pay_payload_2)
        assert res_pay_2.status_code == 200
        pay_res_2 = res_pay_2.json()
        doc_settled = pay_res_2["document"]
        assert Decimal(str(doc_settled["paid_amount"])) == Decimal("300000.00")
        assert Decimal(str(doc_settled["remaining_balance"])) == Decimal("0.00")
        assert doc_settled["payment_status"] == "paid"
        assert len(doc_settled["payment_history"]) == 2

        # 6. Attempting to pay on an already settled document returns 422
        res_pay_3 = client.post(f"/api/v1/public/documents/{public_token}/pay", json=pay_payload_2)
        assert res_pay_3.status_code == 422

        # 7. Non-existent token returns 404
        res_404 = client.get("/api/v1/public/documents/doc_nonexistent_token_12345")
        assert res_404.status_code == 404
