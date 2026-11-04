from fastapi.testclient import TestClient

from app.main import app


def test_contact_leads_requires_auth() -> None:
    with TestClient(app) as client:
        resp = client.get("/api/v1/contact/leads")
    assert resp.status_code == 401


def test_contact_leads_forbidden_for_regular_tenant_user() -> None:
    headers = {
        "X-Tenant-ID": "tenant-test-client",
        "X-User-ID": "user-client-123",
        "X-Koryxa-Source": "koryxa-services-ia",
        "X-Koryxa-Role": "member",
        "X-Koryxa-Permissions": "service-ia:read,service-ia:write",
    }
    with TestClient(app) as client:
        resp = client.get("/api/v1/contact/leads", headers=headers)
    assert resp.status_code == 403
    assert "Accès interdit" in resp.json()["error"]["message"]


def test_contact_leads_forbidden_for_tenant_owner_without_platform_admin() -> None:
    headers = {
        "X-Tenant-ID": "tenant-test-client",
        "X-User-ID": "user-owner-123",
        "X-Koryxa-Source": "koryxa-services-ia",
        "X-Koryxa-Role": "owner",
        "X-Koryxa-Permissions": "service-ia:read,service-ia:write",
    }
    with TestClient(app) as client:
        resp = client.get("/api/v1/contact/leads", headers=headers)
    assert resp.status_code == 403


def test_contact_leads_allowed_for_platform_admin() -> None:
    headers = {
        "X-Tenant-ID": "koryxa-admin-tenant",
        "X-User-ID": "superadmin-001",
        "X-Koryxa-Source": "koryxa-admin",
        "X-Koryxa-Role": "admin",
        "X-Koryxa-Permissions": "system:admin,contact:manage",
    }
    with TestClient(app) as client:
        resp = client.get("/api/v1/contact/leads", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
