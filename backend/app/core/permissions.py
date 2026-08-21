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
            "organization:manage",
            "members:read",
            "members:manage",
            "invitations:manage",
            "registers:read",
            "registers:manage",
        }
    ),
    MemberRole.CONTRIBUTOR: frozenset(
        {
            "organization:read",
            "organization:manage",
            "members:read",
            "registers:read",
            "registers:manage",
        }
    ),
}


async def get_current_organization(identity: IdentityDep, session: SessionDep) -> Organization:
    # 1. Active membership
    organization = await session.scalar(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == identity.user_id,
            OrganizationMember.status == MemberStatus.ACTIVE,
            Organization.is_active.is_(True),
        )
        .order_by(OrganizationMember.joined_at.desc())
    )
    if organization is not None:
        return organization

    # 2. Fallback: Search by tenant_id and auto-attach owner membership
    if identity.tenant_id and identity.tenant_id != "anonymous":
        org_by_tenant = await session.scalar(
            select(Organization)
            .where(
                Organization.tenant_id == identity.tenant_id,
                Organization.is_active.is_(True),
            )
            .order_by(Organization.created_at.desc())
        )
        if org_by_tenant is not None:
            existing_member = await session.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org_by_tenant.id,
                    OrganizationMember.user_id == identity.user_id,
                )
            )
            if existing_member:
                existing_member.status = MemberStatus.ACTIVE
                existing_member.role = MemberRole.OWNER
            else:
                session.add(
                    OrganizationMember(
                        organization_id=org_by_tenant.id,
                        user_id=identity.user_id,
                        role=MemberRole.OWNER,
                        status=MemberStatus.ACTIVE,
                    )
                )
            await session.commit()
            return org_by_tenant

    raise ApplicationError(
        "organization_not_found", "Aucune organisation Service IA n'est liée à ce tenant", 404
    )


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
        # Auto-create active OWNER membership if missing
        member = OrganizationMember(
            organization_id=organization.id,
            user_id=identity.user_id,
            role=MemberRole.OWNER,
            status=MemberStatus.ACTIVE,
        )
        session.add(member)
        await session.commit()
        await session.refresh(member)
    return member


def require_permission(permission: str) -> Callable[..., object]:
    async def dependency(identity: IdentityDep, session: SessionDep) -> OrganizationMember:
        member = await get_current_member(identity, session)
        local_permissions = ROLE_PERMISSIONS.get(member.role, frozenset())
        upstream_permissions = identity.permissions

        if (
            member.role in (MemberRole.OWNER, MemberRole.MANAGER)
            or (identity.role and identity.role.lower() in ("admin", "owner", "superadmin", "gerant", "directeur"))
            or permission in local_permissions
            or permission in upstream_permissions
            or "service-ia:*" in upstream_permissions
            or "*:*" in upstream_permissions
        ):
            return member

        raise ApplicationError("permission_denied", "Permission insuffisante", 403)

    return dependency
