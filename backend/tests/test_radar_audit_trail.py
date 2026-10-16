"""Audit events are created only on genuine tenant-scoped Radar transitions."""
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.db.session import SessionFactory
from app.models.workflow import AuditEvent
import asyncio


def test_radar_transition_audited_once_and_isolated():
    with TestClient(app) as client:
        a = {"X-Tenant-ID": "audit-radar-a", "X-User-ID": "audit-owner-a"}
        b = {"X-Tenant-ID": "audit-radar-b", "X-User-ID": "audit-owner-b"}
        org_ids = {}
        for headers, slug in ((a, "audit-radar-a"), (b, "audit-radar-b")):
            created = client.post("/api/v1/organizations", headers=headers, json={"name": slug, "slug": slug})
            assert created.status_code == 201, created.text
            org_ids[slug] = created.json()["id"]
        offer = client.post("/api/v1/registers/offers", headers=a, json={"name": "Sans tarif", "status": "validated"})
        assert offer.status_code == 201, offer.text
        assert client.post("/api/v1/radar/runs", headers=a).status_code == 201
        alert = next(item for item in client.get("/api/v1/radar/alerts", headers=a).json()
                     if item["rule_code"] == "offer.price_missing")
        url = f"/api/v1/radar/alerts/{alert['id']}"
        assert client.patch(url, headers=b, json={"status": "acknowledged"}).status_code == 404
        assert client.patch(url, headers=a, json={"status": "acknowledged"}).status_code == 200
        assert client.patch(url, headers=a, json={"status": "acknowledged"}).status_code == 200

        async def check():
            async with SessionFactory() as session:
                events = (await session.scalars(select(AuditEvent).where(
                    AuditEvent.entity_id == alert["id"],
                    AuditEvent.entity_type == "radar_alert",
                ))).all()
                assert len(events) == 1
                event = events[0]
                assert event.actor_user_id == "audit-owner-a"
                assert event.payload == {"from": "open", "to": "acknowledged"}
                assert event.organization_id == org_ids["audit-radar-a"]

        asyncio.run(check())
