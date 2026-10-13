"""Evidence-based financial ledger tests, isolated database only."""
from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient
from app.main import app
from app.models.finance import CashAccount, CashMovement
from app.services.finance_ledger import account_balances


def test_financial_evidence_is_tenant_scoped_and_no_balance_is_fabricated():
    with TestClient(app) as client:
        headers_a = {"X-Tenant-ID": "ledger-tenant-a", "X-User-ID": "ledger-actor-a"}
        headers_b = {"X-Tenant-ID": "ledger-tenant-b", "X-User-ID": "ledger-actor-b"}
        for headers in (headers_a, headers_b):
            tenant = headers["X-Tenant-ID"]
            r = client.post("/api/v1/organizations", headers=headers, json={"name": tenant, "slug": tenant})
            assert r.status_code == 201, r.text
        r = client.post("/api/v1/finance/accounts", headers=headers_a, json={"name": "Caisse boutique", "currency": "XOF"})
        assert r.status_code == 201, r.text
        cash_id = r.json()["id"]
        data_a = client.get("/api/v1/finance/accounts", headers=headers_a)
        data_b = client.get("/api/v1/finance/accounts", headers=headers_b)
        assert data_a.status_code == 200 and data_b.status_code == 200
        assert len(data_a.json()) == 1 and data_a.json()[0]["balance"] is None
        assert data_b.json() == []
        invalid = client.post("/api/v1/finance/movements", headers=headers_b, json={
            "account_id": cash_id, "occurred_on": "2026-10-13", "amount": "100",
            "direction": "in", "category": "capital",
        })
        assert invalid.status_code == 404
        r = client.post("/api/v1/finance/movements", headers=headers_a, json={
            "account_id": cash_id, "occurred_on": "2026-10-13", "amount": "100",
            "direction": "in", "category": "capital",
        })
        assert r.status_code == 201, r.text
        # Ledger activity alone cannot establish historical bank balance.
        assert client.get("/api/v1/finance/accounts", headers=headers_a).json()[0]["balance"] is None
        declared = client.patch(f"/api/v1/finance/accounts/{cash_id}/opening", headers=headers_a, json={
            "opening_balance": "10.00", "opening_date": "2026-10-01",
        })
        assert declared.status_code == 200, declared.text
        assert Decimal(str(client.get("/api/v1/finance/accounts", headers=headers_a).json()[0]["balance"])) == 110
        # Historical opening data must not be silently rewritten after confirmation.
        assert client.patch(f"/api/v1/finance/accounts/{cash_id}/opening", headers=headers_a, json={
            "opening_balance": "999.00", "opening_date": "2026-10-01",
        }).status_code == 409


def test_account_with_opening_balance_and_movement_sums():
    with TestClient(app) as client:
        headers = {"X-Tenant-ID": "ledger-tally", "X-User-ID": "ledger-tally-owner"}
        assert client.post("/api/v1/organizations", headers=headers, json={"name": "Ledger tally", "slug": "ledger-tally"}).status_code == 201
        created = client.post("/api/v1/finance/accounts", headers=headers, json={
            "name": "Bank", "currency": "XOF", "opening_date": "2026-10-01", "opening_balance": "200.00",
        })
        assert created.status_code == 201, created.text
        account_id = created.json()["id"]
        for direction, amount in (("in", "120.00"), ("out", "70.00")):
            resp = client.post("/api/v1/finance/movements", headers=headers, json={
                "account_id": account_id, "occurred_on": "2026-10-13", "amount": amount,
                "direction": direction, "category": "other",
            })
            assert resp.status_code == 201, resp.text
        balances = client.get("/api/v1/finance/accounts", headers=headers)
        assert balances.status_code == 200
        balance = balances.json()[0]
        assert Decimal(str(balance["balance"])) == Decimal("250.00")
        assert balance["reconciliation_status"] == "not_bank_reconciled"
        assert balance["status"] == "calculable_from_declared_ledger"


def test_financial_schema_rejects_partial_opening_balance_and_negative_flow():
    with TestClient(app) as client:
        headers = {"X-Tenant-ID": "ledger-validation", "X-User-ID": "ledger-validation-owner"}
        assert client.post("/api/v1/organizations", headers=headers, json={"name": "Ledger validate", "slug": "ledger-validation"}).status_code == 201
        assert client.post("/api/v1/finance/accounts", headers=headers, json={
            "name": "Invalid", "currency": "XOF", "opening_balance": "0"
        }).status_code == 422
        r = client.post("/api/v1/finance/accounts", headers=headers, json={"name": "Cash", "currency": "XOF"})
        assert r.status_code == 201
        account_id = r.json()["id"]
        r = client.post("/api/v1/finance/movements", headers=headers, json={
            "account_id": account_id, "occurred_on": "2026-10-13", "amount": "-1",
            "direction": "out", "category": "other",
        })
        assert r.status_code == 422
        r = client.post("/api/v1/finance/movements", headers=headers, json={
            "account_id": account_id, "occurred_on": "2026-10-13", "amount": "20",
            "direction": "out", "category": "transfer",
        })
        assert r.status_code == 422
