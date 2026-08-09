from datetime import date, timedelta
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


def test_expenses_crud_and_quick_payment_status() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-exp-1", "user-exp-1")

        # 1. Create an Expense
        exp_res = client.post(
            "/api/v1/registers/expenses",
            headers=owner,
            json={
                "reference": "DEP-2026-001",
                "expense_date": date.today().isoformat(),
                "category": "Loyer",
                "beneficiary": "Bailleur Immobilier",
                "amount": 250000,
                "currency": "XOF",
                "payment_method": "Virement",
                "payment_status": "unpaid",
                "invoice_number": "FAC-LOYER-01",
            },
        )
        assert exp_res.status_code == 201
        exp_data = exp_res.json()
        assert exp_data["reference"] == "DEP-2026-001"
        assert Decimal(str(exp_data["amount"])) == Decimal("250000")
        exp_id = exp_data["id"]

        # 2. List Expenses
        list_res = client.get("/api/v1/registers/expenses", headers=owner)
        assert list_res.status_code == 200
        assert list_res.json()["total"] == 1

        # 3. Quick Payment Status Update (Mark as Paid)
        patch_res = client.patch(
            f"/api/v1/registers/expenses/{exp_id}/payment-status",
            headers=owner,
            json={"payment_status": "paid", "payment_method": "Wave"},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["payment_status"] == "paid"
        assert patch_res.json()["payment_method"] == "Wave"


def test_suppliers_crud() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-sup-1", "user-sup-1")

        # 1. Create Supplier
        sup_res = client.post(
            "/api/v1/registers/suppliers",
            headers=owner,
            json={
                "name": "Fournisseur Matériaux SA",
                "category": "Matériaux",
                "contact_name": "M. Traoré",
                "phone": "+2250102030405",
                "email": "contact@materiaux-sa.ci",
                "address": "Abidjan, Zone Industrielle",
                "payment_terms": "30 jours fin de mois",
            },
        )
        assert sup_res.status_code == 201
        sup_id = sup_res.json()["id"]
        assert sup_res.json()["name"] == "Fournisseur Matériaux SA"

        # 2. List Suppliers
        list_res = client.get("/api/v1/registers/suppliers", headers=owner)
        assert list_res.status_code == 200
        assert list_res.json()["total"] == 1

        # 3. Update Supplier
        update_res = client.put(
            f"/api/v1/registers/suppliers/{sup_id}",
            headers=owner,
            json={"contact_name": "Mme Touré"},
        )
        assert update_res.status_code == 200
        assert update_res.json()["contact_name"] == "Mme Touré"


def test_cashflow_summary_and_financial_radar_alerts() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-cashflow-1", "user-cashflow-1")

        # 1. Create a paid Sale of 100 000 and an unpaid Sale of 50 000
        client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "VTE-001",
                "sale_date": date.today().isoformat(),
                "item_label": "Prestation A",
                "quantity": 1,
                "unit_price": 100000,
                "discount": 0,
                "total_amount": 100000,
                "currency": "XOF",
                "payment_status": "paid",
            },
        )
        client.post(
            "/api/v1/registers/sales",
            headers=owner,
            json={
                "reference": "VTE-002",
                "sale_date": date.today().isoformat(),
                "item_label": "Prestation B",
                "quantity": 1,
                "unit_price": 50000,
                "discount": 0,
                "total_amount": 50000,
                "currency": "XOF",
                "payment_status": "unpaid",
            },
        )

        # 2. Create an Expense of 30 000 paid and an overdue unpaid Expense of 20 000
        client.post(
            "/api/v1/registers/expenses",
            headers=owner,
            json={
                "reference": "DEP-001",
                "expense_date": date.today().isoformat(),
                "category": "Fournitures",
                "beneficiary": "Papeterie",
                "amount": 30000,
                "currency": "XOF",
                "payment_status": "paid",
            },
        )
        past_date = (date.today() - timedelta(days=45)).isoformat()
        client.post(
            "/api/v1/registers/expenses",
            headers=owner,
            json={
                "reference": "DEP-002",
                "expense_date": past_date,
                "category": "Maintenance",
                "beneficiary": "Technicien",
                "amount": 20000,
                "currency": "XOF",
                "payment_status": "unpaid",
            },
        )

        # 3. Test Cashflow summary
        cf_res = client.get("/api/v1/registers/cashflow-summary", headers=owner)
        assert cf_res.status_code == 200
        data = cf_res.json()
        assert Decimal(str(data["total_income_paid"])) == Decimal("100000")
        assert Decimal(str(data["total_income_unpaid"])) == Decimal("50000")
        assert Decimal(str(data["total_expenses_paid"])) == Decimal("30000")
        assert Decimal(str(data["total_expenses_unpaid"])) == Decimal("20000")
        # Net Cash = 100 000 - 30 000 = 70 000
        assert Decimal(str(data["net_cash_position"])) == Decimal("70000")
        # Projected 30d = 70 000 + 50 000 - 20 000 = 100 000
        assert Decimal(str(data["projected_30d_cash"])) == Decimal("100000")

        # 4. Run Radar and check financial alerts
        radar_run = client.post("/api/v1/radar/runs", headers=owner)
        assert radar_run.status_code == 201

        alerts_res = client.get("/api/v1/radar/alerts", headers=owner)
        assert alerts_res.status_code == 200
        alerts = alerts_res.json()
        overdue_expense_alerts = [a for a in alerts if a["rule_code"] == "expense.payment_overdue"]
        assert len(overdue_expense_alerts) >= 1
