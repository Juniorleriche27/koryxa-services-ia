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


def test_owner_can_update_name_and_logo() -> None:
    webp = b"RIFF" + (4).to_bytes(4, "little") + b"WEBP" + b"test"
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/organizations",
            headers=OWNER_HEADERS,
            json={"name": "Ancien nom", "slug": "entreprise-branding"},
        )
        assert created.status_code == 201
        updated = client.patch(
            "/api/v1/organizations/current",
            headers=OWNER_HEADERS,
            json={"name": "Nouveau nom"},
        )
        logo = client.post(
            "/api/v1/organizations/current/logo",
            headers=OWNER_HEADERS,
            files={"file": ("logo.webp", webp, "image/webp")},
        )
        downloaded = client.get("/api/v1/organizations/current/logo", headers=OWNER_HEADERS)
    assert updated.status_code == 200
    assert updated.json()["name"] == "Nouveau nom"
    assert logo.status_code == 200
    assert logo.json()["logo_updated_at"] is not None
    assert downloaded.status_code == 200
    assert downloaded.content == webp


def test_logo_rejects_non_image_content() -> None:
    with TestClient(app) as client:
        client.post(
            "/api/v1/organizations",
            headers=OWNER_HEADERS,
            json={"name": "Entreprise logo", "slug": "entreprise-invalid-logo"},
        )
        response = client.post(
            "/api/v1/organizations/current/logo",
            headers=OWNER_HEADERS,
            files={"file": ("logo.webp", b"not-an-image", "image/webp")},
        )
    assert response.status_code == 400


def test_owner_can_complete_organization_onboarding() -> None:
    with TestClient(app) as client:
        client.post(
            "/api/v1/organizations",
            headers=OWNER_HEADERS,
            json={"name": "Entreprise à configurer", "slug": "entreprise-onboarding"},
        )
        response = client.post(
            "/api/v1/organizations/current/onboarding",
            headers=OWNER_HEADERS,
            json={
                "name": "Atelier Lumière",
                "sector": "Architecture",
                "country": "France",
                "responsible_name": "Aminata Diallo",
                "responsible_role": "Gérante",
                "primary_goal": "documents",
            },
        )
    assert response.status_code == 200
    assert response.json()["name"] == "Atelier Lumière"
    assert response.json()["responsible_name"] == "Aminata Diallo"
    assert response.json()["primary_goal"] == "documents"
    assert response.json()["onboarding_completed_at"] is not None
