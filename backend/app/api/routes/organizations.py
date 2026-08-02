from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_member, get_current_organization
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.organizations import OrganizationCreate, OrganizationRead
from app.services.organizations import OrganizationService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrganizationDep = Annotated[Organization, Depends(get_current_organization)]
MemberDep = Annotated[OrganizationMember, Depends(get_current_member)]


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate, session: SessionDep, identity: IdentityDep
) -> Organization:
    return await OrganizationService().create(session, identity, data)


@router.get("/current", response_model=OrganizationRead)
async def current_organization(organization: OrganizationDep, _: MemberDep) -> Organization:
    return organization
