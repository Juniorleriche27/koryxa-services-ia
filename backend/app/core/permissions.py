from __future__ import annotations

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.db.session import get_session
from app.models.member import MemberRole, MemberStatus, OrganizationMember
from app.models.organization import Organization

IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]

ROLE_PERMISSIONS: dict[MemberRole, frozenset[str]] = {
    MemberRole.OWNER: frozenset(
        {
            "organization:read",
            "organization:manage",
            "members:read",
            "members:manage",
            "invitations:manage",
            "registers:read",
            "registers:manage",
        }
    ),
    MemberRole.MANAGER: frozenset(
        {
            "organization:read",
            "members:read",
            "members:manage",
            "invitations:manage",
            "registers:read",
            "registers:manage",
        }
    ),
    MemberRole.CONTRIBUTOR: frozenset({"organization:read", "members:read", "registers:read"}),
}


async def get_current_organization(identity: IdentityDep, session: SessionDep) -> Organization:
    organization = await session.scalar(
        select(Organization).where(
            Organization.tenant_id == identity.tenant_id, Organization.is_active.is_(True)
        )
    )
    if organization is None:
        raise ApplicationError(
            "organization_not_found", "Aucune organisation Service IA n'est liée à ce tenant", 404
        )
    return organization


async def get_current_member(identity: IdentityDep, session: SessionDep) -> OrganizationMember:
    organization = await get_current_organization(identity, session)
    member = await session.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == identity.user_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
        )
    )
    if member is None:
        raise ApplicationError(
            "member_not_found",
            "L'utilisateur KORYXA n'est pas membre actif de cette organisation",
            403,
        )
    return member


def require_permission(permission: str) -> Callable[..., object]:
    async def dependency(identity: IdentityDep, session: SessionDep) -> OrganizationMember:
        member = await get_current_member(identity, session)
        local_permissions = ROLE_PERMISSIONS[member.role]
        upstream_permissions = identity.permissions
        if (
            permission not in local_permissions
            and permission not in upstream_permissions
            and "service-ia:*" not in upstream_permissions
        ):
            raise ApplicationError("permission_denied", "Permission insuffisante", 403)
        return member

    return dependency
