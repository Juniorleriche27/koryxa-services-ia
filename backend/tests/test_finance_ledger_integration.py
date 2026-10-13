"""Ledger transfer and classification integration checks; local test DB only."""
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app


def test_transfer_is_balanced_restricted_by_tenant_and_requires_matching_currency():
    with TestClient(app) as c:
        h = {"X-Tenant-ID": "transfer-owner", "X-User-ID": "transfer-manager"}
        assert c.post("/api/v1/organizations", headers=h, json={"name": "Transfer owner", "slug": "transfer-owner"}).status_code == 201
        ids = []
        for name, currency in (("Main", "XOF"), ("Secondary", "XOF"), ("EUR", "EUR")):
            res = c.post("/api/v1/finance/accounts", headers=h, json={
                "name": name, "currency": currency, "opening_balance": "100.00", "opening_date": "2026-10-01",
            })
            assert res.status_code == 201, res.text
            ids.append(res.json()["id"])
        base = {"source_account_id": ids[0], "target_account_id": ids[1], "occurred_on": "2026-10-13", "amount": "25.00"}
        result = c.post("/api/v1/finance/transfers", headers=h, json=base)
        assert result.status_code == 201, result.text
        assert result.json()["legs"] == 2
        balances = {a["account_id"]: Decimal(str(a["balance"])) for a in c.get("/api/v1/finance/accounts", headers=h).json()}
        assert balances[ids[0]] == Decimal("75")
        assert balances[ids[1]] == Decimal("125")
        assert balances[ids[0]] + balances[ids[1]] == Decimal("200")
        incompatible = c.post("/api/v1/finance/transfers", headers=h, json={**base, "target_account_id": ids[2]})
        assert incompatible.status_code == 422
        self_transfer = c.post("/api/v1/finance/transfers", headers=h, json={**base, "target_account_id": ids[0]})
        assert self_transfer.status_code == 422


def test_cost_classification_isolated_by_tenant():
    with TestClient(app) as c:
        a = {"X-Tenant-ID": "cost-tenant-a", "X-User-ID": "cost-user-a"}
        b = {"X-Tenant-ID": "cost-tenant-b", "X-User-ID": "cost-user-b"}
        for h in (a, b):
            tenant = h["X-Tenant-ID"]
            assert c.post("/api/v1/organizations", headers=h, json={"name": tenant, "slug": tenant}).status_code == 201
        created = c.post("/api/v1/registers/expenses", headers=a, json={
            "reference": "COST-01", "expense_date": "2026-10-13", "title": "Loyer test", "beneficiary": "Bailleur test", "amount": 100, "currency": "XOF",
        })
        assert created.status_code == 201, created.text
        eid = created.json()["id"]
        forbidden = c.put(f"/api/v1/finance/expenses/{eid}/classification", headers=b, json={"behavior": "fixed", "relation": "indirect"})
        assert forbidden.status_code == 404
        updated = c.put(f"/api/v1/finance/expenses/{eid}/classification", headers=a, json={"behavior": "fixed", "relation": "indirect"})
        assert updated.status_code == 200, updated.text
        assert updated.json()["behavior"] == "fixed"
        coverage = c.get("/api/v1/finance/cost-coverage", headers=a)
        assert coverage.status_code == 200
        assert coverage.json()["gross_margin"] is None
