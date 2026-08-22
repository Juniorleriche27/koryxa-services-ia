from __future__ import annotations

import hashlib
import hmac
import math
import time
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.models.attendance import AttendanceRecord
from app.models.member import OrganizationMember, MemberStatus
from app.models.organization import Organization
from app.schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceCheckOutRequest,
    AttendanceKioskTokenResponse,
    AttendanceRecordRead,
    AttendanceTodaySummary,
)


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in meters between two GPS coordinates."""
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class AttendanceService:
    STEP_SECONDS = 30

    def _get_org_secret(self, org_id: str) -> bytes:
        proxy_secret = get_settings().proxy_secret or "koryxa-attendance-default-key"
        return f"{org_id}:{proxy_secret}".encode("utf-8")

    def _generate_totp(self, org_id: str, time_step: int) -> str:
        secret = self._get_org_secret(org_id)
        msg = time_step.to_bytes(8, byteorder="big")
        h = hmac.new(secret, msg, hashlib.sha256).hexdigest()
        return h[:8].upper()

    def generate_kiosk_token(self, org: Organization) -> AttendanceKioskTokenResponse:
        current_time = int(time.time())
        current_step = current_time // self.STEP_SECONDS
        token = self._generate_totp(org.id, current_step)
        valid_until = datetime.fromtimestamp((current_step + 1) * self.STEP_SECONDS, tz=timezone.utc)
        expires_in = (current_step + 1) * self.STEP_SECONDS - current_time

        qr_payload = f"koryxa:checkin:{org.id}:{token}:{int(valid_until.timestamp())}"
        return AttendanceKioskTokenResponse(
            token=token,
            qr_payload=qr_payload,
            expires_in_seconds=max(1, expires_in),
            organization_id=org.id,
            organization_name=org.name,
            valid_until=valid_until,
        )

    def verify_token(self, org_id: str, submitted_token: str) -> bool:
        current_step = int(time.time()) // self.STEP_SECONDS
        clean_token = submitted_token.strip().upper()
        # Accept current window or previous window (tolerance for network transit)
        for step in [current_step, current_step - 1]:
            if self._generate_totp(org_id, step) == clean_token:
                return True
        return False

    async def check_in(
        self,
        s: AsyncSession,
        org: Organization,
        employee_id: str,
        data: AttendanceCheckInRequest,
    ) -> AttendanceRecordRead:
        # 1. Verify TOTP Token (Anti-Photo / Anti-Home check-in)
        if not self.verify_token(org.id, data.token):
            raise ApplicationError(
                "invalid_or_expired_token",
                "Le code QR de pointage a expiré ou est invalide. Veuillez scanner le code affiché actuellement sur la borne.",
                400,
            )

        # 2. Verify GPS Geofence if coordinates are set on the organization
        if org.latitude is not None and org.longitude is not None:
            if data.latitude is None or data.longitude is None:
                raise ApplicationError(
                    "gps_required",
                    "Position GPS obligatoire : Votre établissement requiert la validation de votre présence sur place. Veuillez autoriser l'accès GPS sur votre smartphone.",
                    400,
                )
            distance = haversine_distance_meters(
                org.latitude, org.longitude, data.latitude, data.longitude
            )
            allowed_radius = org.geofence_radius_meters or 50
            if distance > allowed_radius:
                raise ApplicationError(
                    "geofence_violation",
                    f"Position GPS non autorisée : Vous êtes à {int(distance)} mètres de l'établissement (rayon autorisé : {allowed_radius} m).",
                    403,
                )

        today = date.today()
        existing = await s.scalar(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.organization_id == org.id,
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )

        now = datetime.now(timezone.utc)
        if existing:
            # Update check-in or re-confirm
            existing.check_in_lat = data.latitude
            existing.check_in_lng = data.longitude
            existing.employee_name = data.employee_name or existing.employee_name
            existing.notes = data.notes or existing.notes
            await s.commit()
            await s.refresh(existing)
            return AttendanceRecordRead.model_validate(existing)

        # Determine late status (e.g. after 09:30 AM local time default)
        status = "present"
        if now.hour >= 9 and now.minute > 30:
            status = "late"

        record = AttendanceRecord(
            organization_id=org.id,
            employee_id=employee_id,
            employee_name=data.employee_name,
            date=today,
            check_in_time=now,
            check_in_lat=data.latitude,
            check_in_lng=data.longitude,
            status=status,
            verified_by="qr_dynamic_gps",
            notes=data.notes,
        )
        s.add(record)
        await s.commit()
        await s.refresh(record)
        return AttendanceRecordRead.model_validate(record)

    async def check_out(
        self,
        s: AsyncSession,
        org: Organization,
        employee_id: str,
        data: AttendanceCheckOutRequest,
    ) -> AttendanceRecordRead:
        today = date.today()
        record = await s.scalar(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.organization_id == org.id,
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        if not record:
            raise ApplicationError(
                "no_check_in_found",
                "Aucun pointage d'arrivée n'a été trouvé pour aujourd'hui.",
                404,
            )

        now = datetime.now(timezone.utc)
        record.check_out_time = now
        if data.latitude is not None:
            record.check_out_lat = data.latitude
            record.check_out_lng = data.longitude
        if data.notes:
            record.notes = f"{record.notes or ''}\nDépart: {data.notes}".strip()

        await s.commit()
        await s.refresh(record)
        return AttendanceRecordRead.model_validate(record)

    async def get_today_summary(self, s: AsyncSession, org_id: str) -> AttendanceTodaySummary:
        today = date.today()
        records_query = await s.scalars(
            select(AttendanceRecord)
            .where(
                and_(
                    AttendanceRecord.organization_id == org_id,
                    AttendanceRecord.date == today,
                )
            )
            .order_by(AttendanceRecord.check_in_time.asc())
        )
        records = list(records_query.all())

        # Count total active organization members
        total_members = int(
            await s.scalar(
                select(func.count())
                .select_from(OrganizationMember)
                .where(
                    and_(
                        OrganizationMember.organization_id == org_id,
                        OrganizationMember.status == MemberStatus.ACTIVE,
                    )
                )
            )
            or 0
        )

        present_count = sum(1 for r in records if r.status in {"present", "late"})
        late_count = sum(1 for r in records if r.status == "late")
        absent_count = max(0, total_members - present_count)

        return AttendanceTodaySummary(
            date=today,
            total_expected_members=total_members,
            present_count=present_count,
            late_count=late_count,
            absent_count=absent_count,
            records=[AttendanceRecordRead.model_validate(r) for r in records],
        )
