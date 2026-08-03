from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.models.invitation import InvitationStatus, OrganizationInvitation
from app.models.member import MemberStatus, OrganizationMember
from app.models.organization import Organization
from app.schemas.invitations import InvitationCreate
from app.services.email import EmailService


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
        await session.flush()
        organization = await session.get(Organization, organization_id)
        assert organization is not None
        link = f"{get_settings().public_app_url.rstrip('/')}/invitation/{token}"
        try:
            await EmailService().send_invitation(invitation.email, organization.name, link)
        except Exception:
            await session.rollback()
            raise
        await session.commit()
        await session.refresh(invitation)
        return invitation, token

    async def resend(
        self, session: AsyncSession, organization_id: str, invitation_id: str
    ) -> tuple[OrganizationInvitation, str]:
        invitation = await session.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.id == invitation_id,
                OrganizationInvitation.organization_id == organization_id,
                OrganizationInvitation.status == InvitationStatus.PENDING,
            )
        )
        if invitation is None:
            raise ApplicationError("invitation_not_found", "Invitation en attente introuvable", 404)
        token = secrets.token_urlsafe(32)
        invitation.token_hash = self._hash(token)
        invitation.expires_at = datetime.now(UTC) + timedelta(days=7)
        organization = await session.get(Organization, organization_id)
        assert organization is not None
        link = f"{get_settings().public_app_url.rstrip('/')}/invitation/{token}"
        await EmailService().send_invitation(invitation.email, organization.name, link)
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
        self, session: AsyncSession, user_id: str, email: str | None, token: str
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
        if not email or email.strip().lower() != invitation.email:
            raise ApplicationError(
                "invitation_email_mismatch",
                "Connectez-vous avec l’adresse e-mail qui a reçu l’invitation",
                403,
            )
        member = await session.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == invitation.organization_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if member is None:
            member = OrganizationMember(
                organization_id=invitation.organization_id,
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
