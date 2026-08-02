# mypy: disable-error-code="no-untyped-def,no-untyped-call"
# ruff: noqa: B008
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.radar import AlertStatus, RadarDimension
from app.schemas.radar import (
    RadarAlertRead,
    RadarAlertStatusUpdate,
    RadarDocumentFactCreate,
    RadarDocumentFactRead,
    RadarRuleConfigRead,
    RadarRuleConfigUpdate,
    RadarRunRead,
)
from app.services.radar import RadarService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]


@router.get("/rules", response_model=list[RadarRuleConfigRead])
async def rules(s: SessionDep, o: OrgDep, _: ReadDep):
    return await RadarService().list_configs(s, o.id)


@router.put("/rules/{code}", response_model=RadarRuleConfigRead)
async def set_rule(
    code: str, data: RadarRuleConfigUpdate, s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep
):
    return await RadarService().set_config(s, o.id, i.user_id, code, data)


@router.post("/document-facts", response_model=RadarDocumentFactRead, status_code=201)
async def add_fact(data: RadarDocumentFactCreate, s: SessionDep, o: OrgDep, _: ManageDep):
    return await RadarService().add_fact(s, o.id, data)


@router.post("/runs", response_model=RadarRunRead, status_code=201)
async def run(s: SessionDep, i: IdentityDep, o: OrgDep, _: ManageDep):
    return await RadarService().run(s, o.id, i.user_id)


@router.get("/alerts", response_model=list[RadarAlertRead])
async def alerts(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    status: AlertStatus | None = None,
    dimension: RadarDimension | None = None,
):
    return await RadarService().alerts(s, o.id, status, dimension)


@router.patch("/alerts/{alert_id}", response_model=RadarAlertRead)
async def update_alert(
    alert_id: str, data: RadarAlertStatusUpdate, s: SessionDep, o: OrgDep, _: ManageDep
):
    return await RadarService().update_alert(s, o.id, alert_id, data.status)
