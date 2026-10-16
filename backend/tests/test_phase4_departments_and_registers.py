"""Phase 4: safe financial sums and organization-scoped institutional catalogue."""
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.models.member import MemberRole
from app.services.departments import department_catalogue
from app.services.financial_metrics import summarize_registers
from app.models.registers import Sale, Expense


def test_conflicting_sales_payments_never_produce_trusted_amounts():
    sale = Sale(organization_id="tenant", reference="CONFLICT", sale_date="2026-10-16", total_amount=Decimal("100"), paid_amount=Decimal("150"), document_type="invoice", status="validated", payment_status="paid", currency="XOF", is_archived=False)
    data = summarize_registers([sale], []).summary
    assert data["financial_data_status"] == "incomplete_payments"
    assert data["total_paid_amount"] is None
    assert data["total_unpaid_amount"] is None
    assert data["total_sales_amount"] == Decimal("100")


def test_unpaid_status_with_nonzero_money_must_be_reviewed():
    expense = Expense(organization_id="tenant", reference="CONFLICT", expense_date="2026-10-16", amount=Decimal("100"), paid_amount=Decimal("20"), status="validated", payment_status="unpaid", currency="XOF", is_archived=False)
    data = summarize_registers([], [expense]).summary
    assert data["financial_data_status"] == "incomplete_payments"
    assert data["total_expenses_paid"] is None


def test_department_permissions_and_catalogue_are_stable():
    owner = department_catalogue("org-a", MemberRole.OWNER)
    contributor = department_catalogue("org-b", MemberRole.CONTRIBUTOR)
    assert owner["schema_version"] == "1.0"
    assert len(owner["departments"]) == 6
    assert {d["id"] for d in owner["departments"]} == {d["id"] for d in contributor["departments"]}
    assert all(d["allowed"] for d in owner["departments"])
    assert owner["organization_id"] != contributor["organization_id"]
    assert all(d["required_permission"].endswith(":read") for d in contributor["departments"])


def test_department_api_requires_org_and_active_membership():
    with TestClient(app) as client:
        assert client.get("/api/v1/departments").status_code in (401, 403, 404)
        a = {"X-Tenant-ID": "phase4-dept-a", "X-User-ID": "phase4-owner-a"}
        b = {"X-Tenant-ID": "phase4-dept-b", "X-User-ID": "phase4-owner-b"}
        for headers, slug in [(a, "phase4-a"), (b, "phase4-b")]:
            res = client.post("/api/v1/organizations", headers=headers, json={"name": slug, "slug": slug})
            assert res.status_code == 201, res.text
            result = client.get("/api/v1/departments", headers=headers)
            assert result.status_code == 200, result.text
            payload = result.json()
            assert payload["organization_id"] == res.json()["id"]
            assert len(payload["departments"]) == 6
            assert all(d["allowed"] for d in payload["departments"])
