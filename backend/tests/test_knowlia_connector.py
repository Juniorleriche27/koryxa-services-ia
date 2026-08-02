import httpx
import pytest

from app.core.identity import KoryxaIdentity
from app.integrations.knowlia import KnowliaClient


@pytest.mark.asyncio
async def test_knowlia_client_propagates_koryxa_context_and_contract() -> None:
    captured: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        captured.append(request)
        if request.url.path == "/v1/documents/opencloud-references":
            return httpx.Response(
                201,
                json={
                    "request_id": "req-1",
                    "data": {
                        "document_id": "doc-1",
                        "tenant_id": "tenant-a",
                        "display_name": "brochure.pdf",
                        "path": "tenant-a/file.pdf",
                        "source_type": "opencloud",
                        "status": "registered",
                    },
                },
            )
        if request.url.path == "/v1/documents/doc-1/ingestions":
            return httpx.Response(
                202,
                json={
                    "request_id": "req-1",
                    "data": {
                        "job_id": "job-1",
                        "document_id": "doc-1",
                        "tenant_id": "tenant-a",
                        "status": "queued",
                        "chunks_created": 0,
                    },
                },
            )
        raise AssertionError(request.url.path)

    identity = KoryxaIdentity(
        tenant_id="tenant-a",
        user_id="user-a",
        source="koryxa-admin",
        auth_provider="koryxa-admin",
        role="owner",
        permissions=frozenset({"service-ia:*"}),
    )
    client = KnowliaClient(transport=httpx.MockTransport(handler))

    document = await client.register_document(
        identity,
        {
            "display_name": "brochure.pdf",
            "path": "tenant-a/file.pdf",
            "mime_type": "application/pdf",
            "metadata": {"service_ia_attachment_id": "att-1"},
        },
        "req-1",
    )
    ingestion = await client.start_ingestion(identity, "doc-1", 1200, "req-1")

    assert document["document_id"] == "doc-1"
    assert ingestion["job_id"] == "job-1"
    assert captured[0].headers["X-Tenant-ID"] == "tenant-a"
    assert captured[0].headers["X-User-ID"] == "user-a"
    assert captured[0].headers["X-Koryxa-Source"] == "service-ia"
    assert "knowlia.documents.ingest" in captured[0].headers["X-Koryxa-Permissions"]
    assert captured[0].headers["X-Request-ID"] == "req-1"


@pytest.mark.asyncio
async def test_knowlia_client_maps_remote_error() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            403,
            json={"error": {"code": "permission_denied", "message": "forbidden"}},
        )

    identity = KoryxaIdentity(
        tenant_id="tenant-a",
        user_id="user-a",
        source=None,
        auth_provider=None,
        role=None,
        permissions=frozenset(),
    )
    client = KnowliaClient(transport=httpx.MockTransport(handler))

    with pytest.raises(Exception) as exc_info:
        await client.get_document(identity, "doc-1")

    assert "Knowlia a retourné 403" in str(exc_info.value)
