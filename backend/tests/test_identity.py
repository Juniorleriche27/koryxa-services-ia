from fastapi.testclient import TestClient

from app.core.config import get_settings
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


def test_proxy_secret_protects_trusted_identity_headers() -> None:
    settings = get_settings()
    previous = settings.proxy_secret
    settings.proxy_secret = "a-secure-internal-proxy-secret-1234"
    headers = {
        "X-Tenant-ID": "tenant-demo",
        "X-User-ID": "user-demo",
        "X-Koryxa-Source": "koryxa-admin",
    }
    try:
        with TestClient(app) as client:
            rejected = client.get("/api/v1/context/me", headers=headers)
            accepted = client.get(
                "/api/v1/context/me",
                headers={
                    **headers,
                    "X-Koryxa-Proxy-Secret": "a-secure-internal-proxy-secret-1234",
                },
            )
    finally:
        settings.proxy_secret = previous
    assert rejected.status_code == 401
    assert accepted.status_code == 200
