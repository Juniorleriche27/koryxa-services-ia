from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=100)
    business_category: str = Field(default="retail", max_length=40)


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    business_category: str | None = Field(default=None, max_length=40)
    latitude: float | None = None
    longitude: float | None = None
    geofence_radius_meters: int | None = Field(default=None, ge=10, le=5000)
    sector: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    responsible_name: str | None = Field(default=None, max_length=180)


class OrganizationOnboarding(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    business_category: str = Field(default="retail", max_length=40)
    sector: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    responsible_name: str = Field(min_length=2, max_length=180)
    responsible_role: str | None = Field(default=None, max_length=120)
    primary_goal: str = Field(default="sales", max_length=50)
    initial_cash_balance: float | None = Field(default=None, description="Solde initial de caisse")
    historical_turnover: float | None = Field(
        default=None, description="Chiffre d'affaires historique cumulé"
    )
    historical_receivables: float | None = Field(
        default=None, description="Créances clients antérieures en attente"
    )
    currency: str = Field(default="XOF", max_length=10)
    whatsapp_number: str | None = Field(default=None, max_length=30)
    city_address: str | None = Field(default=None, max_length=200)
    latitude: float | None = None
    longitude: float | None = None
    geofence_radius_meters: int = Field(default=50, ge=10, le=5000)


class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tenant_id: str
    name: str
    slug: str
    is_active: bool
    business_category: str = "retail"
    latitude: float | None = None
    longitude: float | None = None
    geofence_radius_meters: int = 50
    logo_updated_at: datetime | None = None
    sector: str | None = None
    country: str | None = None
    responsible_name: str | None = None
    responsible_role: str | None = None
    primary_goal: str | None = None
    onboarding_completed_at: datetime | None = None
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime
