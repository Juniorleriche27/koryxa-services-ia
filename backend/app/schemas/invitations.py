from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.invitation import InvitationStatus
from app.models.member import MemberRole


class InvitationCreate(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.CONTRIBUTOR


class InvitationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    email: str
    role: MemberRole
    status: InvitationStatus
    invited_by_user_id: str
    expires_at: datetime
    accepted_by_user_id: str | None
    created_at: datetime


class InvitationCreated(InvitationRead):
    token: str


class InvitationAccept(BaseModel):
    token: str
