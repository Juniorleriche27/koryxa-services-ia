from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.member import MemberRole, MemberStatus


class MemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    user_id: str
    role: MemberRole
    status: MemberStatus
    invited_by_user_id: str | None
    joined_at: datetime
    updated_at: datetime


class MemberRoleUpdate(BaseModel):
    role: MemberRole


class MemberStatusUpdate(BaseModel):
    status: MemberStatus
