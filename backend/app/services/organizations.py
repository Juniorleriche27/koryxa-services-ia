from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.core.identity import KoryxaIdentity
from app.models.member import MemberRole, OrganizationMember
from app.models.organization import Organization
from app.schemas.organizations import OrganizationCreate


class OrganizationService:
    async def create(
        self, session: AsyncSession, identity: KoryxaIdentity, data: OrganizationCreate
    ) -> Organization:
        existing = await session.scalar(
            select(Organization).where(
                (Organization.tenant_id == identity.tenant_id) | (Organization.slug == data.slug)
            )
        )
        if existing is not None:
            raise ApplicationError(
                "organization_exists", "Une organisation existe déjà pour ce tenant ou ce slug", 409
            )
        organization = Organization(
            tenant_id=identity.tenant_id,
            name=data.name,
            slug=data.slug,
            created_by_user_id=identity.user_id,
        )
        session.add(organization)
        await session.flush()
        session.add(
            OrganizationMember(
                organization_id=organization.id, user_id=identity.user_id, role=MemberRole.OWNER
            )
        )
        await session.commit()
        await session.refresh(organization)
        return organization

    async def get_for_tenant(self, session: AsyncSession, tenant_id: str) -> Organization:
        organization = await session.scalar(
            select(Organization).where(
                Organization.tenant_id == tenant_id, Organization.is_active.is_(True)
            )
        )
        if organization is None:
            raise ApplicationError("organization_not_found", "Organisation introuvable", 404)
        return organization
