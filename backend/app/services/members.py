from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.member import MemberRole, MemberStatus, OrganizationMember


class MemberService:
    async def list(self, session: AsyncSession, organization_id: str) -> list[OrganizationMember]:
        result = await session.scalars(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == organization_id)
            .order_by(OrganizationMember.joined_at)
        )
        return list(result.all())

    async def get(
        self, session: AsyncSession, organization_id: str, member_id: str
    ) -> OrganizationMember:
        member = await session.scalar(
            select(OrganizationMember).where(
                OrganizationMember.id == member_id,
                OrganizationMember.organization_id == organization_id,
            )
        )
        if member is None:
            raise ApplicationError("member_not_found", "Membre introuvable", 404)
        return member

    async def update_role(
        self, session: AsyncSession, organization_id: str, member_id: str, role: MemberRole
    ) -> OrganizationMember:
        member = await self.get(session, organization_id, member_id)
        if member.role == MemberRole.OWNER and role != MemberRole.OWNER:
            owners = await session.scalars(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == organization_id,
                    OrganizationMember.role == MemberRole.OWNER,
                    OrganizationMember.status == MemberStatus.ACTIVE,
                )
            )
            if len(list(owners.all())) <= 1:
                raise ApplicationError(
                    "last_owner", "Le dernier propriétaire actif ne peut pas être rétrogradé", 409
                )
        member.role = role
        await session.commit()
        await session.refresh(member)
        return member

    async def update_status(
        self, session: AsyncSession, organization_id: str, member_id: str, status: MemberStatus
    ) -> OrganizationMember:
        member = await self.get(session, organization_id, member_id)
        if member.role == MemberRole.OWNER and status != MemberStatus.ACTIVE:
            owners = await session.scalars(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == organization_id,
                    OrganizationMember.role == MemberRole.OWNER,
                    OrganizationMember.status == MemberStatus.ACTIVE,
                )
            )
            if len(list(owners.all())) <= 1:
                raise ApplicationError(
                    "last_owner", "Le dernier propriétaire actif ne peut pas être désactivé", 409
                )
        member.status = status
        await session.commit()
        await session.refresh(member)
        return member
