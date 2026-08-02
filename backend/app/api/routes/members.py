from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.members import MemberRead, MemberRoleUpdate, MemberStatusUpdate
from app.services.members import MemberService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
OrganizationDep = Annotated[Organization, Depends(get_current_organization)]
ReadPermission = Annotated[OrganizationMember, Depends(require_permission("members:read"))]
ManagePermission = Annotated[OrganizationMember, Depends(require_permission("members:manage"))]


@router.get("", response_model=list[MemberRead])
async def list_members(
    session: SessionDep, organization: OrganizationDep, _: ReadPermission
) -> list[OrganizationMember]:
    return await MemberService().list(session, organization.id)


@router.patch("/{member_id}/role", response_model=MemberRead)
async def update_member_role(
    member_id: str,
    data: MemberRoleUpdate,
    session: SessionDep,
    organization: OrganizationDep,
    _: ManagePermission,
) -> OrganizationMember:
    return await MemberService().update_role(session, organization.id, member_id, data.role)


@router.patch("/{member_id}/status", response_model=MemberRead)
async def update_member_status(
    member_id: str,
    data: MemberStatusUpdate,
    session: SessionDep,
    organization: OrganizationDep,
    _: ManagePermission,
) -> OrganizationMember:
    return await MemberService().update_status(session, organization.id, member_id, data.status)
