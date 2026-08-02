from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.invitation import OrganizationInvitation
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.invitations import (
    InvitationAccept,
    InvitationCreate,
    InvitationCreated,
    InvitationRead,
)
from app.schemas.members import MemberRead
from app.services.invitations import InvitationService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrganizationDep = Annotated[Organization, Depends(get_current_organization)]
ManagePermission = Annotated[OrganizationMember, Depends(require_permission("invitations:manage"))]


@router.post("", response_model=InvitationCreated, status_code=status.HTTP_201_CREATED)
async def create_invitation(
    data: InvitationCreate,
    session: SessionDep,
    identity: IdentityDep,
    organization: OrganizationDep,
    _: ManagePermission,
) -> InvitationCreated:
    invitation, token = await InvitationService().create(
        session, organization.id, identity.user_id, data
    )
    public_invitation = InvitationRead.model_validate(invitation)
    return InvitationCreated(
        **public_invitation.model_dump(),
        token=token,
    )


@router.get("", response_model=list[InvitationRead])
async def list_invitations(
    session: SessionDep, organization: OrganizationDep, _: ManagePermission
) -> list[OrganizationInvitation]:
    return await InvitationService().list(session, organization.id)


@router.post("/{invitation_id}/revoke", response_model=InvitationRead)
async def revoke_invitation(
    invitation_id: str, session: SessionDep, organization: OrganizationDep, _: ManagePermission
) -> OrganizationInvitation:
    return await InvitationService().revoke(session, organization.id, invitation_id)


@router.post("/accept", response_model=MemberRead)
async def accept_invitation(
    data: InvitationAccept, session: SessionDep, identity: IdentityDep
) -> OrganizationMember:
    return await InvitationService().accept(
        session, identity.tenant_id, identity.user_id, data.token
    )
