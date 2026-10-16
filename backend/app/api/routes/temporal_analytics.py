"""Temporal analytics: protected, tenant-scoped and read-only."""
from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.organization import Organization
from app.services.temporal_analytics import DateWindow, temporal_snapshot

router = APIRouter()


@router.get("")
async def get_temporal_analytics(
    start: Annotated[date, Query()],
    end: Annotated[date, Query(description="Date de fin exclusive")],
    session: Annotated[AsyncSession, Depends(get_session)],
    organization: Annotated[Organization, Depends(get_current_organization)],
    _: Annotated[object, Depends(require_permission("registers:read"))],
) -> dict[str, Any]:
    from fastapi import HTTPException
    try:
        window = DateWindow(start, end)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return await temporal_snapshot(session, str(organization.id), window)
