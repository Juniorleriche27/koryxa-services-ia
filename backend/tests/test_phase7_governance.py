"""Backend phase 7: formula governance, safe personalization, access contracts."""
from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.services.phase7_governance import FORMULA_CATALOGUE, financial_provenance
from app.services.departments import department_catalogue
from app.models.member import MemberRole


def test_formula_catalogue_unique_and_explicit():
    assert len({item['code'] for item in FORMULA_CATALOGUE}) == len(FORMULA_CATALOGUE)
    assert all(item['version'] and item['source'] and item['rule'] for item in FORMULA_CATALOGUE)
    record = financial_provenance('estimated_gross_margin', organization_id='org-a', currency='XOF', status='incomplet')
    assert record['formula_version'] == '5.1'
    assert record['trace_kind'] == 'formula_metadata_not_transaction_audit'
    with pytest.raises(ValueError):
        financial_provenance('estimated_gross_margin', organization_id='org-a', currency='xof', status='calculable')
    with pytest.raises(ValueError):
        financial_provenance('unknown', organization_id='org-a', currency='XOF', status='calculable')


def test_catalogue_does_not_claim_frontend_or_external_availability():
    result = department_catalogue('company-1', MemberRole.CONTRIBUTOR)
    assert len(result['departments']) == 6
    assert all(d['availability_scope'] == 'backend_module_only' for d in result['departments'])
    assert all(d['access_status'] in ('autorise', 'interdit') for d in result['departments'])


def test_grand_hall_profile_isolation_and_private_key_redaction():
    with TestClient(app) as client:
        ids = []
        for i in (1, 2):
            headers = {'X-Tenant-ID': f'phase7-{i}', 'X-User-ID': f'phase7-user-{i}'}
            created = client.post('/api/v1/organizations', headers=headers,
                                  json={'name': f'Entreprise {i}', 'slug': f'phase7-company-{i}'})
            assert created.status_code == 201, created.text
            response = client.get('/api/v1/grand-hall', headers=headers)
            assert response.status_code == 200, response.text
            profile = response.json()['organization_profile']
            ids.append(profile['organization_id'])
            assert profile['name'] == f'Entreprise {i}'
            assert 'logo_storage_key' not in profile
            assert 'tenant_id' not in profile
            assert 'responsible_name' not in profile
        assert ids[0] != ids[1]
