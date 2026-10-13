"""CAURI financial invariants; no real database or fictitious production records."""
from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.registers import Expense, Sale
from app.services.financial_metrics import summarize_registers

TODAY = date(2026, 10, 13)


def sale(amount="100", paid="0", payment_status="unpaid", *, due=None, status="validated", doc="invoice", currency="XOF", archived=False):
    return Sale(
        organization_id="test-org", reference="TEST-S", sale_date=TODAY,
        total_amount=Decimal(amount), paid_amount=Decimal(paid),
        payment_status=payment_status, status=status, document_type=doc,
        currency=currency, due_date=due, is_archived=archived,
    )


def expense(amount="60", paid=None, payment_status="unpaid", *, due=None, status="validated", currency="XOF"):
    return Expense(
        organization_id="test-org", reference="TEST-E", expense_date=TODAY,
        amount=Decimal(amount), paid_amount=None if paid is None else Decimal(paid),
        payment_status=payment_status, status=status,
        currency=currency, due_date=due, is_archived=False,
    )


def snapshot(sales=(), expenses=()):
    return summarize_registers(sales, expenses, today=TODAY).summary


def test_fully_paid_sale_and_mean_order():
    sm = snapshot([sale("549018.50", "549018.50", "paid")])
    assert sm["total_sales_amount"] == Decimal("549018.50")
    assert sm["total_paid_amount"] == Decimal("549018.50")
    assert sm["total_unpaid_amount"] == 0
    assert sm["recovery_rate"] == 100.0
    assert sm["average_order_value"] == 549018.5


def test_partially_paid_and_credit_sale():
    sm = snapshot([
        sale("100", "25", "partial"),
        sale("50", "0", "unpaid"),
    ])
    assert sm["total_paid_amount"] == Decimal("25")
    assert sm["total_unpaid_amount"] == Decimal("125")
    assert sm["total_partial_amount"] == Decimal("75")
    assert sm["recovery_rate"] == 16.7


def test_due_dates_distinguish_overdue_upcoming_today_and_unspecified():
    sm = snapshot([
        sale("100", due=TODAY-timedelta(days=1)),
        sale("20", due=TODAY+timedelta(days=5)),
        sale("30", due=TODAY),
        sale("40"),
    ])
    assert sm["receivables_overdue"] == 100
    assert sm["receivables_not_due"] == 20
    assert sm["receivables_due_today"] == 30
    assert sm["receivables_without_due_date"] == 40


def test_non_revenue_documents_nonvalidated_cancelled_refunded_and_archived():
    sm = snapshot([
        sale(status="draft"), sale(status="obsolete"), sale(doc="quote"),
        sale(doc="proforma"), sale(payment_status="cancelled"),
        sale(payment_status="refunded"), sale(archived=True),
        sale("22", "0", "unpaid"),
    ])
    assert sm["total_sales_count"] == 1
    assert sm["excluded_sales_count"] == 7
    assert sm["pending_validation_sales_count"] == 1
    assert sm["total_sales_amount"] == 22


def test_expense_paid_partially_paid_and_unpaid():
    sm = snapshot([], [
        expense("90", "90", "paid"),
        expense("60", "20", "partial", due=TODAY-timedelta(days=1)),
        expense("25", "0", "unpaid"),
    ])
    assert sm["total_expenses_paid"] == 110
    assert sm["total_expenses_unpaid"] == 65
    assert sm["payables_overdue"] == 40
    assert sm["cash_movement_net"] == -110


def test_no_sales_and_no_expenses_no_fake_ratios_or_profit():
    sm = snapshot()
    assert sm["total_sales_count"] == 0
    assert sm["total_sales_amount"] == 0
    for field in ("recovery_rate", "average_order_value", "gross_margin_rate",
                  "estimated_gross_margin", "break_even_point", "break_even_progress",
                  "daily_burn_rate", "cash_runway_days", "working_capital",
                  "net_cash_position", "projected_30d_cash"):
        assert sm[field] is None


def test_negative_register_delta_does_not_mean_negative_bank_cash():
    sm = snapshot([sale("100", "50", "partial")], [expense("80", "80", "paid")])
    assert sm["cash_movement_net"] == -30
    assert sm["net_cash_position"] is None


def test_incomplete_payment_not_silently_counted_as_full():
    sm = snapshot([sale("100", "0", "paid")])
    assert sm["financial_data_status"] == "incomplete_payments"
    assert sm["total_paid_amount"] is None
    assert sm["total_unpaid_amount"] is None
    assert sm["recovery_rate"] is None


def test_mixed_currency_does_not_add_xof_to_eur():
    sm = snapshot([sale("100", "100", "paid", currency="XOF")],
                  [expense("20", "20", "paid", currency="EUR")])
    assert sm["financial_data_status"] == "mixed_currencies"
    assert sm["currency_codes"] == ["EUR", "XOF"]
    assert sm["total_sales_amount"] is None
    assert sm["cash_movement_net"] is None


def test_no_30_day_assumption_from_old_expense():
    sm = snapshot([sale("100", "100", "paid")], [expense("5", "5", "paid")])
    assert sm["cash_runway_days"] is None
    assert sm["daily_burn_rate"] is None
    assert sm["break_even_point"] is None
    assert sm["working_capital"] is None


def test_tenant_isolation_of_dashboard_and_cashflow_summary():
    with TestClient(app) as client:
        auth_a = {"X-Tenant-ID": "finance-tenant-a", "X-User-ID": "finance-user-a"}
        auth_b = {"X-Tenant-ID": "finance-tenant-b", "X-User-ID": "finance-user-b"}
        for auth in (auth_a, auth_b):
            name = auth["X-Tenant-ID"]
            assert client.post("/api/v1/organizations", headers=auth,
                               json={"name": name, "slug": name}).status_code == 201
        for auth, amount in ((auth_a, 100), (auth_b, 900)):
            resp = client.post("/api/v1/registers/sales", headers=auth, json={
                "reference": "TENANT-S", "sale_date": TODAY.isoformat(),
                "item_label": "Produit test", "quantity": 1,
                "unit_price": amount, "total_amount": amount,
                "payment_status": "paid", "status": "validated", "currency": "XOF",
            })
            assert resp.status_code == 201, resp.text
        for auth, amount in ((auth_a, 100), (auth_b, 900)):
            summary = client.get("/api/v1/dashboard", headers=auth)
            assert summary.status_code == 200, summary.text
            assert Decimal(str(summary.json()["summary"]["total_sales_amount"])) == amount
            cf = client.get("/api/v1/registers/cashflow-summary", headers=auth)
            assert cf.status_code == 200, cf.text
            assert Decimal(str(cf.json()["total_income_paid"])) == amount
            assert cf.json()["net_cash_position"] is None
