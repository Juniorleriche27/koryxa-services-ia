from fastapi.testclient import TestClient

from app.main import app


def test_identity_context_is_required() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/context/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "http_error"


def test_identity_context_is_returned() -> None:
    headers = {
        "X-Tenant-ID": "tenant-demo",
        "X-User-ID": "user-demo",
        "X-Koryxa-Source": "koryxa-admin",
        "X-Koryxa-Auth-Provider": "koryxa-identity",
        "X-Koryxa-Role": "owner",
        "X-Koryxa-Permissions": "service-ia:read,service-ia:write",
    }
    with TestClient(app) as client:
        response = client.get("/api/v1/context/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["tenant_id"] == "tenant-demo"
    assert response.json()["permissions"] == ["service-ia:read", "service-ia:write"]
