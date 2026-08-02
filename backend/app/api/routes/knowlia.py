# mypy: disable-error-code="no-untyped-def"
# ruff: noqa: B008
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.knowlia import KnowliaStatusRead, KnowliaSyncCreate, KnowliaSyncRead
from app.services.knowlia import KnowliaSyncService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]


@router.post("/sync", response_model=KnowliaSyncRead, status_code=202)
async def sync(
    data: KnowliaSyncCreate,
    request: Request,
    s: SessionDep,
    i: IdentityDep,
    o: OrgDep,
    _: ManageDep,
):
    return await KnowliaSyncService().create(
        s, o.id, i, data, getattr(request.state, "request_id", None)
    )


@router.get("/sync/{sync_id}", response_model=KnowliaSyncRead)
async def get_sync(sync_id: str, s: SessionDep, o: OrgDep, _: ReadDep):
    return await KnowliaSyncService().get(s, o.id, sync_id)


@router.post("/sync/{sync_id}/refresh", response_model=KnowliaStatusRead)
async def refresh(
    sync_id: str, request: Request, s: SessionDep, i: IdentityDep, o: OrgDep, _: ReadDep
):
    job, status = await KnowliaSyncService().refresh(
        s, o.id, i, sync_id, getattr(request.state, "request_id", None)
    )
    return KnowliaStatusRead(sync=KnowliaSyncRead.model_validate(job), knowlia_status=status)


@router.post("/sync/{sync_id}/retry", response_model=KnowliaSyncRead)
async def retry(
    sync_id: str, request: Request, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await KnowliaSyncService().retry(
        s, o.id, i, sync_id, getattr(request.state, "request_id", None)
    )
