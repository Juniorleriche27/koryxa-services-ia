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
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIConfigRead,
    AIConfigUpdate,
    PaymentReminderRequest,
    PaymentReminderResponse,
    ProcedureGenerationRequest,
    ProcedureGenerationResponse,
)
from app.services.ai_engine import AIEngineService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]
ai_service = AIEngineService()


@router.get("/config", response_model=AIConfigRead)
async def get_ai_config(s: SessionDep, o: OrgDep, _: ReadDep):
    return await ai_service.get_config(s, o.id)


@router.put("/config", response_model=AIConfigRead)
async def update_ai_config(data: AIConfigUpdate, s: SessionDep, o: OrgDep, _: ManageDep):
    return await ai_service.update_config(s, o.id, data)


@router.post("/chat", response_model=AIChatResponse)
async def copilot_chat(data: AIChatRequest, s: SessionDep, i: IdentityDep, o: OrgDep, _: ReadDep):
    return await ai_service.chat(s, o.id, i.user_id, data)


@router.post("/generate-payment-reminder", response_model=PaymentReminderResponse)
async def generate_payment_reminder(
    data: PaymentReminderRequest, s: SessionDep, i: IdentityDep, o: OrgDep, _: ReadDep
):
    return await ai_service.generate_payment_reminder(s, o.id, i.user_id, data)


@router.post("/generate-procedure", response_model=ProcedureGenerationResponse)
async def generate_procedure(
    data: ProcedureGenerationRequest, s: SessionDep, i: IdentityDep, o: OrgDep, _: ReadDep
):
    return await ai_service.generate_procedure(s, o.id, i.user_id, data)
