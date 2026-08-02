from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=100)


class OrganizationUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=180)


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    slug: str
    is_active: bool
    logo_updated_at: datetime | None
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime
