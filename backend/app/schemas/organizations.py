from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=100)


class OrganizationUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=180)


class OrganizationOnboarding(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    sector: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    responsible_name: str = Field(min_length=2, max_length=180)
    responsible_role: str = Field(min_length=2, max_length=120)
    primary_goal: str = Field(
        pattern=r"^(sales|offers|procedures|imports|documents|discover)$"
    )


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    slug: str
    is_active: bool
    logo_updated_at: datetime | None
    sector: str | None
    country: str | None
    responsible_name: str | None
    responsible_role: str | None
    primary_goal: str | None
    onboarding_completed_at: datetime | None
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime
