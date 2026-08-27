from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.automations import (
    DailyDigestResponse,
    SendAutomationResult,
    UnpaidRemindersResponse,
)
from app.services.automations import AutomationService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("registers:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("registers:manage"))]

service = AutomationService()


@router.get("/daily-digest", response_model=DailyDigestResponse)
async def get_daily_digest(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    target_date: date | None = Query(None, description="Date du bilan (par défaut aujourd'hui)"),
):
    """Calcule et formate le bilan journalier exécutif (CA, dépenses, alertes stock, présences)."""
    return await service.get_daily_digest(s, o.id, target_date)


@router.post("/daily-digest/send", response_model=SendAutomationResult)
async def send_daily_digest(
    s: SessionDep,
    o: OrgDep,
    _: ManageDep,
    target_date: date | None = Query(None, description="Date du bilan"),
):
    """Déclenche l'envoi du bilan journalier de 21h00 par WhatsApp et notification."""
    return await service.send_daily_digest(s, o.id, target_date)


@router.get("/unpaid-reminders", response_model=UnpaidRemindersResponse)
async def get_unpaid_reminders(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    min_days: int = Query(1, ge=0, description="Délai minimum en jours depuis la vente"),
):
    """Scanne et prépare les messages de relance personnalisés pour les factures impayées."""
    return await service.get_unpaid_reminders(s, o.id, min_days)


@router.post("/unpaid-reminders/send", response_model=SendAutomationResult)
async def send_unpaid_reminders(
    s: SessionDep,
    o: OrgDep,
    _: ManageDep,
    min_days: int = Query(1, ge=0, description="Délai minimum en jours"),
):
    """Déclenche la campagne de relance matinale des impayés (09h00)."""
    return await service.send_unpaid_reminders(s, o.id, min_days)
