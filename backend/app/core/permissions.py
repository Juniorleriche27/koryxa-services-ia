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
            "workflow:read",
            "workflow:manage",
            "radar:read",
            "radar:manage",
            "documents:read",
            "documents:manage",
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
            "workflow:read",
            "workflow:manage",
            "radar:read",
            "documents:read",
            "documents:manage",
        }
    ),
    MemberRole.CONTRIBUTOR: frozenset(
        {
            "organization:read",
            "members:read",
            "registers:read",
            "workflow:read",
            "radar:read",
            "documents:read",
        }
    ),
}


async def get_current_organization(identity: IdentityDep, session: SessionDep) -> Organization:
    """Résout l'organisation courante en garantissant une isolation multi-tenant stricte."""
    if not identity.tenant_id or identity.tenant_id == "anonymous":
        raise ApplicationError(
            "unauthorized_tenant", "Contexte de tenant manquant ou invalide", 401
        )

    # 1. Résolution STRICTE par le tenant_id de l'identité
    organization = await session.scalar(
        select(Organization).where(
            Organization.tenant_id == identity.tenant_id,
            Organization.is_active.is_(True),
        )
    )

    if organization is None:
        raise ApplicationError(
            "organization_not_found", "Aucune organisation active pour ce tenant", 404
        )

    return organization


async def get_current_member(identity: IdentityDep, session: SessionDep) -> OrganizationMember:
    """Vérifie que l'utilisateur est bien un membre actif de l'organisation courante sans auto-promotion."""
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
            "forbidden_member",
            "Vous n'avez pas d'adhésion active dans cette organisation",
            403,
        )

    return member


def require_permission(permission: str) -> Callable[..., object]:
    """Contrôle d'accès basé sur les rôles stricts (RBAC) au niveau de l'organisation."""
    async def dependency(identity: IdentityDep, session: SessionDep) -> OrganizationMember:
        member = await get_current_member(identity, session)

        # L'OWNER possède tous les droits sur son organisation
        if member.role == MemberRole.OWNER:
            return member

        local_permissions = ROLE_PERMISSIONS.get(member.role, frozenset())

        if permission in local_permissions:
            return member

        raise ApplicationError(
            "permission_denied",
            f"Permission '{permission}' refusée pour le rôle {member.role}",
            403,
        )

    return dependency
