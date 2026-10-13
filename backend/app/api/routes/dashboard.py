# mypy: disable-error-code="no-untyped-def,no-untyped-call"
# ruff: noqa: B008
from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_member, get_current_organization
from app.db.session import get_session
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.models.radar import AlertStatus, RadarAlert
from app.models.workflow import ActionStatus, CorrectiveAction
from app.schemas.organizations import OrganizationRead
from app.schemas.radar import RadarAlertRead
from app.schemas.registers import SaleRead
from app.schemas.workflow import ActionRead
from app.services.financial_summary import fetch_summary as _fetch_summary

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
MemberDep = Annotated[OrganizationMember, Depends(get_current_member)]




async def _fetch_alerts(s: AsyncSession, org_id: str) -> list[Any]:
    return list((await s.scalars(
        select(RadarAlert)
        .where(RadarAlert.organization_id == org_id, RadarAlert.status == AlertStatus.OPEN)
        .order_by(RadarAlert.created_at.desc())
        .limit(20)
    )).all())


async def _fetch_actions(s: AsyncSession, org_id: str) -> list[Any]:
    return list((await s.scalars(
        select(CorrectiveAction)
        .where(
            CorrectiveAction.organization_id == org_id,
            CorrectiveAction.status.in_([ActionStatus.TODO, ActionStatus.IN_PROGRESS]),
        )
        .order_by(CorrectiveAction.created_at.desc())
        .limit(20)
    )).all())


@router.get("")
async def get_dashboard(s: SessionDep, organization: OrgDep, _: MemberDep) -> dict[str, Any]:
    """Single aggregated dashboard endpoint using asyncio.gather() for parallelism."""
    org_id = str(organization.id)
    # AsyncSession is not safe for concurrent operations on one connection.
    summary = await _fetch_summary(s, org_id)
    alerts = await _fetch_alerts(s, org_id)
    actions = await _fetch_actions(s, org_id)
    # Serialize ORM objects with Pydantic schemas before returning
    summary["recent_sales"] = [
        SaleRead.model_validate(sale, from_attributes=True).model_dump(mode="json")
        for sale in summary.get("recent_sales", [])
    ]
    # Convert Decimal to float for JSON serialization
    for key, val in summary.items():
        if hasattr(val, "__class__") and val.__class__.__name__ == "Decimal":
            summary[key] = float(val)
    return {
        "organization": OrganizationRead.model_validate(organization, from_attributes=True).model_dump(mode="json"),
        "summary": summary,
        "alerts": [RadarAlertRead.model_validate(a, from_attributes=True).model_dump(mode="json") for a in alerts],
        "actions": [ActionRead.model_validate(a, from_attributes=True).model_dump(mode="json") for a in actions],
    }
