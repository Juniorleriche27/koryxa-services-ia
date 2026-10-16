"""GET /radar/rules never persists default rows."""
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from app.main import app
from app.db.session import SessionFactory
from app.models.radar import RadarRuleConfig
import asyncio


def test_default_rule_projection_is_read_only():
    with TestClient(app) as client:
        headers = {"X-Tenant-ID": "radar-get-no-write", "X-User-ID": "radar-get-owner"}
        org = client.post('/api/v1/organizations', headers=headers,
                          json={'name': 'Radar GET Audit', 'slug': 'radar-get-audit'})
        assert org.status_code == 201, org.text
        org_id = org.json()['id']
        result = client.get('/api/v1/radar/rules', headers=headers)
        assert result.status_code == 200, result.text
        data = result.json()
        assert len(data) >= 10
        assert any(rule['id'] is None and rule['created_at'] is None for rule in data)

        async def count():
            async with SessionFactory() as session:
                return await session.scalar(select(func.count()).select_from(RadarRuleConfig).where(
                    RadarRuleConfig.organization_id == org_id))
        assert asyncio.run(count()) == 0
