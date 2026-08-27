from fastapi.testclient import TestClient

from app.main import app


def create_organization(client: TestClient, tenant_id: str, user_id: str) -> dict[str, str]:
    headers = {
        "X-Tenant-ID": tenant_id,
        "X-User-ID": user_id,
        "X-User-Email": f"{user_id}@example.com",
    }
    response = client.post(
        "/api/v1/organizations",
        headers=headers,
        json={"name": f"Organisation {tenant_id}", "slug": tenant_id},
    )
    assert response.status_code == 201
    return headers


def test_invitation_acceptance_and_member_permissions() -> None:
    with TestClient(app) as client:
        owner_headers = create_organization(client, "tenant-invite-a", "owner-a")
        invitation = client.post(
            "/api/v1/invitations",
            headers=owner_headers,
            json={"email": "member@example.com", "role": "contributor"},
        )
        assert invitation.status_code == 201
        token = invitation.json()["token"]

        member_headers = {
            "X-Tenant-ID": "tenant-invite-a",
            "X-User-ID": "member-a",
            "X-User-Email": "member@example.com",
        }
        accepted = client.post(
            "/api/v1/invitations/accept",
            headers=member_headers,
            json={"token": token},
        )
        assert accepted.status_code == 200

        members = client.get("/api/v1/members", headers=member_headers)
        assert members.status_code == 200

        forbidden = client.post(
            "/api/v1/invitations",
            headers=member_headers,
            json={"email": "other@example.com", "role": "contributor"},
        )
    assert forbidden.status_code == 403


def test_invitation_requires_the_invited_email() -> None:
    with TestClient(app) as client:
        owner_headers = create_organization(client, "tenant-invite-b", "owner-b")
        invitation = client.post(
            "/api/v1/invitations",
            headers=owner_headers,
            json={"email": "cross@example.com", "role": "contributor"},
        )
        assert invitation.status_code == 201
        token = invitation.json()["token"]

        response = client.post(
            "/api/v1/invitations/accept",
            headers={
                "X-Tenant-ID": "tenant-other",
                "X-User-ID": "member-b",
                "X-User-Email": "other@example.com",
            },
            json={"token": token},
        )
    assert response.status_code == 403
