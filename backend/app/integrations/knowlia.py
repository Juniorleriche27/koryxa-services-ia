# mypy: disable-error-code="no-any-return"
from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity


class KnowliaClient:
    def __init__(self, transport: httpx.AsyncBaseTransport | None = None) -> None:
        settings = get_settings()
        self.base_url = settings.knowlia_base_url.rstrip("/")
        self.timeout = settings.knowlia_timeout_seconds
        self.transport = transport

    def headers(self, identity: KoryxaIdentity, request_id: str | None = None) -> dict[str, str]:
        headers = {
            "X-Tenant-ID": identity.tenant_id,
            "X-User-ID": identity.user_id,
            "X-Koryxa-Source": "service-ia",
            "X-Koryxa-Auth-Provider": identity.auth_provider or "koryxa-admin",
            "X-Koryxa-Role": identity.role or "service",
            "X-Koryxa-Permissions": (
                "knowlia.documents.write,knowlia.documents.read,knowlia.documents.ingest,"
                "knowlia.assistants.read,knowlia.assistants.write,knowlia.chat.write"
            ),
        }
        if request_id:
            headers["X-Request-ID"] = request_id
        return headers

    async def _request(
        self, method: str, path: str, identity: KoryxaIdentity, **kwargs: Any
    ) -> dict[str, object]:
        try:
            async with httpx.AsyncClient(
                base_url=self.base_url, timeout=self.timeout, transport=self.transport
            ) as client:
                response = await client.request(
                    method,
                    path,
                    headers=self.headers(identity, kwargs.pop("request_id", None)),
                    **kwargs,
                )
        except httpx.TimeoutException as exc:
            raise ApplicationError(
                "knowlia_timeout", "Knowlia n'a pas répondu dans le délai prévu", 504
            ) from exc
        except httpx.RequestError as exc:
            raise ApplicationError("knowlia_unavailable", "Knowlia est indisponible", 503) from exc
        if response.status_code >= 400:
            try:
                detail = response.json()
            except ValueError:
                detail = {"message": response.text[:500]}
            raise ApplicationError(
                "knowlia_error", f"Knowlia a retourné {response.status_code}: {detail}", 502
            )
        payload = response.json()
        return payload.get("data", payload)

    async def register_document(
        self, identity: KoryxaIdentity, payload: dict[str, object], request_id: str | None = None
    ) -> dict[str, object]:
        return await self._request(
            "POST",
            "/v1/documents/opencloud-references",
            identity,
            json=payload,
            request_id=request_id,
        )

    async def start_ingestion(
        self,
        identity: KoryxaIdentity,
        document_id: str,
        max_chunk_chars: int | None = None,
        request_id: str | None = None,
    ) -> dict[str, object]:
        return await self._request(
            "POST",
            f"/v1/documents/{document_id}/ingestions",
            identity,
            json={"force": False, "max_chunk_chars": max_chunk_chars},
            request_id=request_id,
        )

    async def get_ingestion_status(
        self, identity: KoryxaIdentity, document_id: str, request_id: str | None = None
    ) -> dict[str, object]:
        return await self._request(
            "GET", f"/v1/documents/{document_id}/ingestions", identity, request_id=request_id
        )

    async def get_document(
        self, identity: KoryxaIdentity, document_id: str, request_id: str | None = None
    ) -> dict[str, object]:
        return await self._request(
            "GET", f"/v1/documents/{document_id}", identity, request_id=request_id
        )

    async def create_assistant(
        self,
        identity: KoryxaIdentity,
        name: str,
        description: str = "Copilote opérationnel KORYXA Service IA",
        objective: str = "Assister le dirigeant et les équipes dans le pilotage opérationnel, les ventes, les stocks et les relances.",
        business_profile: dict[str, Any] | str | None = None,
    ) -> dict[str, object]:
        if isinstance(business_profile, dict):
            bp = business_profile
        else:
            bp = {
                "business_name": name[:160] if name else "KORYXA Organisation",
                "industry": "Pilotage & Opérations",
                "description": description[:1200] if description else "Copilote opérationnel",
                "target_customers": [],
                "offers": [],
            }

        payload: dict[str, Any] = {
            "name": name[:120],
            "objective": objective[:600],
            "business_profile": bp,
            "config": {
                "tone": "professional",
                "capabilities": ["chat", "document_qa", "summary"],
                "limits": {
                    "max_response_tokens": 1200,
                    "max_context_chunks": 6,
                    "allow_external_actions": True,
                    "allow_human_handoff": True,
                },
            },
        }
        return await self._request("POST", "/v1/assistants", identity, json=payload)

    async def chat(
        self, identity: KoryxaIdentity, assistant_id: str, message: str, model: str
    ) -> dict[str, object]:
        return await self._request(
            "POST",
            f"/v1/assistants/{assistant_id}/chat",
            identity,
            json={
                "message": message,
                "channel": "api",
                "external_user_ref": identity.user_id,
                "model": model,
                "use_memory": True,
                "memory_limit": 10,
            },
        )
