"""Phase 8: Grand Hall private caching, schema, operational timing and API stability."""
import re
from fastapi.testclient import TestClient
from app.main import app


def test_grand_hall_private_contract_and_backend_department_navigation():
    with TestClient(app) as client:
        for suffix in ('one', 'two'):
            headers = {'X-Tenant-ID': f'phase8-{suffix}', 'X-User-ID': f'phase8-owner-{suffix}'}
            created = client.post('/api/v1/organizations', headers=headers,
                                  json={'name': f'Phase 8 {suffix}', 'slug': f'phase8-{suffix}'})
            assert created.status_code == 201, created.text
            response = client.get('/api/v1/grand-hall', headers=headers)
            assert response.status_code == 200, response.text
            assert response.headers['cache-control'] == 'private, no-store'
            assert response.headers['x-analytics-schema'] == '1.0'
            assert re.fullmatch(r'grand_hall;dur=\d+\.\d', response.headers['server-timing'])
            hall = response.json()
            assert hall['schema_version'] == '1.0'
            assert hall['organization_id'] == created.json()['id']
            assert hall['organization_profile']['organization_id'] == created.json()['id']
            assert hall['radar']['quality_certified'] is False
            assert hall['refresh']['cache_status'] == 'not_cached'
            departments = client.get('/api/v1/departments', headers=headers)
            assert departments.status_code == 200
            assert departments.json()['organization_id'] == created.json()['id']
            assert len(departments.json()['departments']) == 6
            previous = client.get('/api/v1/dashboard', headers=headers)
            assert previous.status_code == 200  # backward compatible
        assert client.get('/api/v1/grand-hall').status_code in (401, 403, 404)
