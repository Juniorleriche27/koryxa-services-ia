from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


@dataclass(frozen=True, slots=True)
class KoryxaIdentity:
    tenant_id: str
    user_id: str
    email: str | None
    source: str | None
    auth_provider: str | None
    role: str | None
    permissions: frozenset[str]


async def require_koryxa_identity(
    tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
    user_id: str | None = Header(default=None, alias="X-User-ID"),
    email: str | None = Header(default=None, alias="X-User-Email"),
    source: str | None = Header(default=None, alias="X-Koryxa-Source"),
    auth_provider: str | None = Header(
        default=None,
        alias="X-Koryxa-Auth-Provider",
    ),
    role: str | None = Header(default=None, alias="X-Koryxa-Role"),
    permissions: str | None = Header(
        default=None,
        alias="X-Koryxa-Permissions",
    ),
) -> KoryxaIdentity:
    settings = get_settings()
    if settings.require_koryxa_context and (not tenant_id or not user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contexte d'identité KORYXA manquant",
        )

    if settings.environment == "production" and source not in settings.trusted_proxy_sources:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Source KORYXA non approuvée",
        )

    parsed_permissions = frozenset(
        item.strip() for item in (permissions or "").split(",") if item.strip()
    )
    return KoryxaIdentity(
        tenant_id=tenant_id or "anonymous",
        user_id=user_id or "anonymous",
        email=email.strip().lower() if email else None,
        source=source,
        auth_provider=auth_provider,
        role=role,
        permissions=parsed_permissions,
    )
