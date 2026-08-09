from fastapi.testclient import TestClient

from app.main import app


def auth(tenant: str, user: str) -> dict[str, str]:
    return {"X-Tenant-ID": tenant, "X-User-ID": user}


def create_org(client: TestClient, tenant: str, user: str) -> dict[str, str]:
    headers = auth(tenant, user)
    response = client.post(
        "/api/v1/organizations",
        headers=headers,
        json={"name": tenant, "slug": tenant},
    )
    assert response.status_code == 201
    return headers


def test_csv_preview_confirm_export_and_rollback() -> None:
    csv_content = (
        b"nom,prix,devise,categorie\n"
        b"Formation IA,350000,XOF,formation\n"
        b"Audit digital,150000,XOF,conseil\n"
    )
    with TestClient(app) as client:
        headers = create_org(client, "tenant-import-a", "owner-import-a")
        preview = client.post(
            "/api/v1/imports/preview",
            headers=headers,
            data={"register_type": "offers"},
            files={"file": ("offres.csv", csv_content, "text/csv")},
        )
        assert preview.status_code == 200
        payload = preview.json()
        assert payload["row_count"] == 2
        assert payload["suggested_mapping"]["nom"] == "name"
        job_id = payload["id"]

        confirmed = client.post(
            f"/api/v1/imports/{job_id}/confirm",
            headers=headers,
            json={"column_mapping": payload["suggested_mapping"]},
        )
        assert confirmed.status_code == 200
        assert confirmed.json()["status"] == "completed"
        assert len(confirmed.json()["imported_record_ids"]) == 2

        exported = client.get("/api/v1/imports/export/offers", headers=headers)
        assert exported.status_code == 200
        assert "Formation IA" in exported.text
        assert "Audit digital" in exported.text

        rolled_back = client.post(
            f"/api/v1/imports/{job_id}/rollback",
            headers=headers,
        )
        assert rolled_back.status_code == 200
        assert rolled_back.json()["status"] == "rolled_back"

        offers = client.get("/api/v1/registers/offers", headers=headers)
        assert offers.status_code == 200
        assert offers.json()["total"] == 0


def test_duplicate_detection_and_tenant_isolation() -> None:
    csv_content = b"nom,prix\nService A,100\nService A,100\n"
    with TestClient(app) as client:
        owner = create_org(client, "tenant-import-b", "owner-import-b")
        other = create_org(client, "tenant-import-c", "owner-import-c")
        preview = client.post(
            "/api/v1/imports/preview",
            headers=owner,
            data={"register_type": "offers"},
            files={"file": ("doublons.csv", csv_content, "text/csv")},
        )
        assert preview.status_code == 200
        assert preview.json()["duplicate_rows"] == [3]
        job_id = preview.json()["id"]

        forbidden = client.post(
            f"/api/v1/imports/{job_id}/confirm",
            headers=other,
            json={"column_mapping": {"nom": "name", "prix": "price"}},
        )
        assert forbidden.status_code == 404


def test_attachment_is_linked_to_current_tenant_record() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-files-a", "owner-files-a")
        other = create_org(client, "tenant-files-b", "owner-files-b")
        offer = client.post(
            "/api/v1/registers/offers",
            headers=owner,
            json={"name": "Offre fichier", "price": "1000"},
        )
        assert offer.status_code == 201
        offer_id = offer.json()["id"]

        uploaded = client.post(
            "/api/v1/imports/attachments",
            headers=owner,
            data={"register_type": "offers", "record_id": offer_id},
            files={"file": ("brochure.pdf", b"%PDF-1.7 demo", "application/pdf")},
        )
        assert uploaded.status_code == 200
        assert uploaded.json()["filename"] == "brochure.pdf"

        listed = client.get(
            "/api/v1/imports/attachments",
            headers=owner,
            params={"register_type": "offers", "record_id": offer_id},
        )
        assert listed.status_code == 200
        assert len(listed.json()) == 1
        attachment_id = listed.json()[0]["id"]

        downloaded = client.get(
            f"/api/v1/imports/attachments/{attachment_id}",
            headers=owner,
        )
        assert downloaded.status_code == 200
        assert downloaded.content == b"PDF demo"
        assert "brochure.pdf" in downloaded.headers["Content-Disposition"]

        hidden_download = client.get(
            f"/api/v1/imports/attachments/{attachment_id}",
            headers=other,
        )
        assert hidden_download.status_code == 404

        hidden = client.get(
            "/api/v1/imports/attachments",
            headers=other,
            params={"register_type": "offers", "record_id": offer_id},
        )
        assert hidden.status_code == 404


def test_direct_upload_token_supports_tsv_import() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-direct-import", "owner-direct-import")
        authorization = client.post(
            "/api/v1/direct-uploads/authorize",
            headers=owner,
            json={"kind": "import", "register_type": "offers"},
        )
        assert authorization.status_code == 200
        payload = authorization.json()
        preview = client.post(
            payload["upload_url"],
            data={"token": payload["token"]},
            files={"file": ("offres.tsv", b"nom\tprix\nAudit\t2500\n", "text/tab-separated-values")},
        )
    assert preview.status_code == 200
    assert preview.json()["row_count"] == 1
    assert preview.json()["suggested_mapping"]["nom"] == "name"


def test_direct_upload_rejects_tampered_token() -> None:
    with TestClient(app) as client:
        owner = create_org(client, "tenant-direct-invalid", "owner-direct-invalid")
        authorization = client.post(
            "/api/v1/direct-uploads/authorize",
            headers=owner,
            json={"kind": "import", "register_type": "offers"},
        ).json()
        response = client.post(
            authorization["upload_url"],
            data={"token": f"{authorization['token']}invalid"},
            files={"file": ("offres.csv", b"nom\nAudit\n", "text/csv")},
        )
    assert response.status_code == 401
