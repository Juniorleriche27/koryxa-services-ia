from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.invitation import InvitationStatus, OrganizationInvitation
from app.models.member import MemberStatus, OrganizationMember
from app.schemas.invitations import InvitationCreate


class InvitationService:
    async def create(
        self,
        session: AsyncSession,
        organization_id: str,
        invited_by_user_id: str,
        data: InvitationCreate,
    ) -> tuple[OrganizationInvitation, str]:
        pending = await session.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.organization_id == organization_id,
                OrganizationInvitation.email == str(data.email).lower(),
                OrganizationInvitation.status == InvitationStatus.PENDING,
            )
        )
        if pending is not None and not self._is_expired(pending.expires_at):
            raise ApplicationError(
                "invitation_exists", "Une invitation active existe déjà pour cet email", 409
            )
        token = secrets.token_urlsafe(32)
        invitation = OrganizationInvitation(
            organization_id=organization_id,
            email=str(data.email).lower(),
            role=data.role,
            token_hash=self._hash(token),
            invited_by_user_id=invited_by_user_id,
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )
        session.add(invitation)
        await session.commit()
        await session.refresh(invitation)
        return invitation, token

    async def list(
        self, session: AsyncSession, organization_id: str
    ) -> list[OrganizationInvitation]:
        result = await session.scalars(
            select(OrganizationInvitation)
            .where(OrganizationInvitation.organization_id == organization_id)
            .order_by(OrganizationInvitation.created_at.desc())
        )
        return list(result.all())

    async def revoke(
        self, session: AsyncSession, organization_id: str, invitation_id: str
    ) -> OrganizationInvitation:
        invitation = await session.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.id == invitation_id,
                OrganizationInvitation.organization_id == organization_id,
            )
        )
        if invitation is None:
            raise ApplicationError("invitation_not_found", "Invitation introuvable", 404)
        if invitation.status != InvitationStatus.PENDING:
            raise ApplicationError(
                "invitation_not_pending", "Seule une invitation en attente peut être révoquée", 409
            )
        invitation.status = InvitationStatus.REVOKED
        await session.commit()
        await session.refresh(invitation)
        return invitation

    async def accept(
        self, session: AsyncSession, tenant_id: str, user_id: str, token: str
    ) -> OrganizationMember:
        invitation = await session.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.token_hash == self._hash(token)
            )
        )
        if invitation is None:
            raise ApplicationError("invitation_invalid", "Invitation invalide", 404)
        if invitation.status != InvitationStatus.PENDING:
            raise ApplicationError(
                "invitation_unavailable", "Cette invitation n'est plus disponible", 409
            )
        if self._is_expired(invitation.expires_at):
            invitation.status = InvitationStatus.EXPIRED
            await session.commit()
            raise ApplicationError("invitation_expired", "Cette invitation a expiré", 410)
        from app.models.organization import Organization

        organization = await session.scalar(
            select(Organization).where(
                Organization.id == invitation.organization_id, Organization.tenant_id == tenant_id
            )
        )
        if organization is None:
            raise ApplicationError(
                "tenant_mismatch", "L'invitation ne correspond pas au tenant KORYXA courant", 403
            )
        member = await session.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization.id,
                OrganizationMember.user_id == user_id,
            )
        )
        if member is None:
            member = OrganizationMember(
                organization_id=organization.id,
                user_id=user_id,
                role=invitation.role,
                invited_by_user_id=invitation.invited_by_user_id,
            )
            session.add(member)
        else:
            member.role = invitation.role
            member.status = MemberStatus.ACTIVE
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_by_user_id = user_id
        await session.commit()
        await session.refresh(member)
        return member

    @staticmethod
    def _is_expired(value: datetime) -> bool:
        now = datetime.now(UTC)
        if value.tzinfo is None:
            return value <= now.replace(tzinfo=None)
        return value <= now

    @staticmethod
    def _hash(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
