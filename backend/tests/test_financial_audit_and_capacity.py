from datetime import date
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.db.session import SessionFactory
from app.main import app
from app.models.finance import FinancialAuditEvent
from app.models.organization import Organization
from app.models.registers import Sale
from app.services import financial_metrics


def test_financial_mutations_emit_tenant_scoped_audit_events():
    with TestClient(app) as client:
        headers = {"X-Tenant-ID": "audit-finance", "X-User-ID": "audit-owner"}
        org = client.post("/api/v1/organizations", headers=headers,
                          json={"name": "Audit Finance", "slug": "audit-finance"}).json()
        sale = client.post("/api/v1/registers/sales", headers=headers, json={
            "reference": "AUD-1", "sale_date": str(date.today()), "item_label": "Service",
            "quantity": "1", "unit_price": "100", "total_amount": "100",
            "paid_amount": "0", "currency": "XOF",
        })
        assert sale.status_code == 201, sale.text
        account = client.post("/api/v1/finance/accounts", headers=headers, json={
            "name": "Caisse audit", "currency": "XOF",
            "opening_balance": "0", "opening_date": str(date.today()),
        })
        assert account.status_code == 201, account.text

        import asyncio
        async def read_events():
            async with SessionFactory() as session:
                return list((await session.scalars(select(FinancialAuditEvent).where(
                    FinancialAuditEvent.organization_id == org["id"]
                ))).all())
        events = asyncio.run(read_events())
        assert {(event.entity_type, event.event_type) for event in events} >= {
            ("sale", "created"), ("cash_account", "created")
        }
        assert all(event.actor_user_id == "audit-owner" for event in events)


def test_financial_audit_payload_keeps_decimal_exact():
    with TestClient(app) as client:
        headers = {"X-Tenant-ID": "audit-decimal", "X-User-ID": "audit-decimal-owner"}
        client.post("/api/v1/organizations", headers=headers,
                    json={"name": "Audit Decimal", "slug": "audit-decimal"})
        account = client.post("/api/v1/finance/accounts", headers=headers, json={
            "name": "Exact", "currency": "XOF", "opening_balance": "12.34",
            "opening_date": str(date.today()),
        })
        assert account.status_code == 201


@pytest.mark.asyncio
async def test_analytics_capacity_fails_closed_without_partial_totals(monkeypatch):
    monkeypatch.setattr(financial_metrics, "get_settings", lambda: SimpleNamespace(max_analytics_records=1))
    async with SessionFactory() as session:
        org = Organization(tenant_id="capacity-test", name="Capacity", slug="capacity-test",
                           created_by_user_id="owner")
        session.add(org)
        await session.flush()
        for index in range(2):
            session.add(Sale(
                organization_id=org.id, reference=f"CAP-{index}", sale_date=date.today(),
                item_label="Service", quantity=1, unit_price=100, total_amount=100,
                paid_amount=100, currency="XOF", created_by_user_id="owner",
                updated_by_user_id="owner",
            ))
        await session.commit()
        snapshot = await financial_metrics.collect_financial_registers(session, org.id)
    assert snapshot.summary["financial_data_status"] == "analytics_capacity_exceeded"
    assert snapshot.summary["sales_records_count"] == 2
    assert snapshot.summary["total_sales_amount"] is None
    assert "aucun total partiel" in snapshot.summary["financial_warnings"][0]
