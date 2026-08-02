from fastapi.testclient import TestClient

from app.main import app

OWNER_HEADERS = {
    "X-Tenant-ID": "tenant-a",
    "X-User-ID": "owner-a",
    "X-Koryxa-Source": "koryxa-admin",
}


def test_create_and_read_organization() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/organizations",
            headers=OWNER_HEADERS,
            json={"name": "Entreprise A", "slug": "entreprise-a"},
        )
        assert response.status_code == 201
        current = client.get("/api/v1/organizations/current", headers=OWNER_HEADERS)
    assert current.status_code == 200
    assert current.json()["tenant_id"] == "tenant-a"


def test_other_tenant_cannot_read_organization() -> None:
    headers = {"X-Tenant-ID": "tenant-b", "X-User-ID": "owner-a"}
    with TestClient(app) as client:
        response = client.get("/api/v1/organizations/current", headers=headers)
    assert response.status_code == 404
