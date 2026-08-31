from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import KoryxaIdentity, require_koryxa_identity
from app.core.permissions import get_current_organization, require_permission
from app.db.session import get_session
from app.models.attendance import AttendanceRecord
from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceCheckOutRequest,
    AttendanceKioskTokenResponse,
    AttendanceRecordRead,
    AttendanceTodaySummary,
)
from app.schemas.registers import Page
from app.services.attendance import AttendanceService

router = APIRouter()
SessionDep = Annotated[AsyncSession, Depends(get_session)]
IdentityDep = Annotated[KoryxaIdentity, Depends(require_koryxa_identity)]
OrgDep = Annotated[Organization, Depends(get_current_organization)]
ReadDep = Annotated[OrganizationMember, Depends(require_permission("members:read"))]
ManageDep = Annotated[OrganizationMember, Depends(require_permission("members:manage"))]

svc = AttendanceService()


@router.get("/kiosk-token", response_model=AttendanceKioskTokenResponse)
async def get_kiosk_token(o: OrgDep, _: ReadDep):
    """Generates the dynamic rotating TOTP token (expires in 30s) for the kiosk display."""
    return svc.generate_kiosk_token(o)


@router.post("/check-in", response_model=AttendanceRecordRead)
async def check_in(
    data: AttendanceCheckInRequest,
    s: SessionDep,
    i: IdentityDep,
    o: OrgDep,
    _: ReadDep,
):
    """Employee check-in validating the dynamic QR token and GPS coordinates within geofence."""
    return await svc.check_in(s, o, i.user_id, data)


@router.post("/check-out", response_model=AttendanceRecordRead)
async def check_out(
    data: AttendanceCheckOutRequest,
    s: SessionDep,
    i: IdentityDep,
    o: OrgDep,
    _: ReadDep,
):
    """Employee departure check-out."""
    return await svc.check_out(s, o, i.user_id, data)


@router.get("/today", response_model=AttendanceTodaySummary)
async def get_today_attendance(s: SessionDep, o: OrgDep, _: ReadDep):
    """Get the full summary of today's attendance records and statistics."""
    return await svc.get_today_summary(s, o.id)


@router.get("/history", response_model=Page)
async def list_attendance_history(
    s: SessionDep,
    o: OrgDep,
    _: ReadDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List historical attendance records for the organization."""
    stmt = (
        select(AttendanceRecord)
        .where(AttendanceRecord.organization_id == o.id)
        .order_by(AttendanceRecord.date.desc(), AttendanceRecord.check_in_time.desc())
    )
    total = int(
        await s.scalar(
            select(func.count()).select_from(
                select(AttendanceRecord).where(AttendanceRecord.organization_id == o.id).subquery()
            )
        )
        or 0
    )
    items = list((await s.scalars(stmt.offset((page - 1) * page_size).limit(page_size))).all())
    return Page(
        items=[AttendanceRecordRead.model_validate(x) for x in items],
        total=total,
        page=page,
        page_size=page_size,
    )
