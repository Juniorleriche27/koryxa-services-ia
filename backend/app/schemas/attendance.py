from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AttendanceCheckInRequest(BaseModel):
    token: str = Field(..., description="Dynamic TOTP token from kiosk screen")
    latitude: float | None = Field(None, description="Employee smartphone GPS latitude")
    longitude: float | None = Field(None, description="Employee smartphone GPS longitude")
    employee_name: str | None = None
    employee_id: str | None = None
    notes: str | None = None


class AttendanceCheckOutRequest(BaseModel):
    token: str | None = Field(None, description="Dynamic TOTP token if required")
    latitude: float | None = None
    longitude: float | None = None
    employee_name: str | None = None
    employee_id: str | None = None
    notes: str | None = None


class AttendanceRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    employee_id: str
    employee_name: str | None = None
    date: date
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    check_in_lat: float | None = None
    check_in_lng: float | None = None
    check_out_lat: float | None = None
    check_out_lng: float | None = None
    status: str
    verified_by: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class AttendanceTodaySummary(BaseModel):
    date: date
    total_expected_members: int = 0
    present_count: int = 0
    late_count: int = 0
    checked_out_count: int = 0
    absent_count: int = 0
    # Aliases for frontend compatibility
    total_present: int = 0
    total_late: int = 0
    total_checked_out: int = 0
    records: list[AttendanceRecordRead] = []


class AttendanceKioskTokenResponse(BaseModel):
    token: str
    qr_payload: str
    expires_in_seconds: int = 30
    organization_id: str
    organization_name: str
    valid_until: datetime
