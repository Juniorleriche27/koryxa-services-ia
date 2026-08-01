from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.identity import KoryxaIdentity, require_koryxa_identity

router = APIRouter()
IdentityDependency = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]


@router.get("/me")
async def current_context(identity: IdentityDependency) -> dict[str, object]:
    return {
        "tenant_id": identity.tenant_id,
        "user_id": identity.user_id,
        "source": identity.source,
        "auth_provider": identity.auth_provider,
        "role": identity.role,
        "permissions": sorted(identity.permissions),
    }
