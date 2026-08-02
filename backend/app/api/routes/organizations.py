from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_member, get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.organizations import OrganizationCreate, OrganizationRead, OrganizationUpdate
from app.services.organizations import OrganizationService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrganizationDep = Annotated[Organization, Depends(get_current_organization)]
MemberDep = Annotated[OrganizationMember, Depends(get_current_member)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("organization:manage"))]


@router.post("", response_model=OrganizationRead, status_code=status.HTTP_201_CREATED)
async def create_organization(
    data: OrganizationCreate, session: SessionDep, identity: IdentityDep
) -> Organization:
    return await OrganizationService().create(session, identity, data)


@router.get("/current", response_model=OrganizationRead)
async def current_organization(organization: OrganizationDep, _: MemberDep) -> Organization:
    return organization


@router.patch("/current", response_model=OrganizationRead)
async def update_current_organization(
    data: OrganizationUpdate, session: SessionDep, organization: OrganizationDep, _: ManageDep
) -> Organization:
    return await OrganizationService().update(session, organization, data)


@router.post("/current/logo", response_model=OrganizationRead)
async def update_current_logo(
    session: SessionDep,
    organization: OrganizationDep,
    _: ManageDep,
    file: UploadFile = File(...),
) -> Organization:
    content = await file.read(3 * 1024 * 1024 + 1)
    return await OrganizationService().update_logo(
        session,
        organization,
        file.filename or "logo.webp",
        file.content_type or "application/octet-stream",
        content,
    )


@router.get("/current/logo", response_model=None)
async def current_logo(organization: OrganizationDep, _: MemberDep) -> Response:
    content, content_type = OrganizationService().read_logo(organization)
    return Response(content=content, media_type=content_type, headers={"Cache-Control": "private, max-age=3600"})
