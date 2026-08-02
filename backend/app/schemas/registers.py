# mypy: disable-error-code="no-untyped-def,assignment"
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.registers import PaymentStatus, RecordSource, RecordStatus


class Page(BaseModel):
    items: list[object]
    total: int
    page: int
    page_size: int


class OfferBase(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: str | None = None
    category: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    billing_unit: str | None = None
    conditions: str | None = None
    inclusions: list[str] = Field(default_factory=list)
    exclusions: list[str] = Field(default_factory=list)
    responsible_user_id: str | None = None
    status: RecordStatus = RecordStatus.DRAFT
    source: RecordSource = RecordSource.MANUAL
    effective_from: date | None = None
    expires_at: date | None = None

    @model_validator(mode="after")
    def dates(self):
        if self.effective_from and self.expires_at and self.expires_at < self.effective_from:
            raise ValueError("expires_at doit être postérieure à effective_from")
        return self


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = None
    billing_unit: str | None = None
    conditions: str | None = None
    inclusions: list[str] | None = None
    exclusions: list[str] | None = None
    responsible_user_id: str | None = None
    status: RecordStatus | None = None
    effective_from: date | None = None
    expires_at: date | None = None


class OfferRead(OfferBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    is_archived: bool
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class SaleBase(BaseModel):
    reference: str = Field(min_length=1, max_length=100)
    sale_date: date
    client_name: str | None = None
    offer_id: str | None = None
    item_label: str = Field(min_length=1, max_length=180)
    quantity: Decimal = Field(default=1, gt=0)
    unit_price: Decimal = Field(default=0, ge=0)
    discount: Decimal = Field(default=0, ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    payment_method: str | None = None
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    seller_user_id: str | None = None
    sales_channel: str | None = None
    comment: str | None = None
    status: RecordStatus = RecordStatus.DRAFT
    source: RecordSource = RecordSource.MANUAL


class SaleCreate(SaleBase):
    pass


class SaleUpdate(BaseModel):
    client_name: str | None = None
    offer_id: str | None = None
    item_label: str | None = None
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    discount: Decimal | None = Field(default=None, ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)
    currency: str | None = None
    payment_method: str | None = None
    payment_status: PaymentStatus | None = None
    seller_user_id: str | None = None
    sales_channel: str | None = None
    comment: str | None = None
    status: RecordStatus | None = None


class SaleRead(SaleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    total_amount: Decimal
    is_archived: bool
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class StepInput(BaseModel):
    position: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None


class ProcedureBase(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    objective: str | None = None
    department: str | None = None
    trigger: str | None = None
    responsible_user_id: str | None = None
    participants: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    expected_result: str | None = None
    validation_date: date | None = None
    next_review_date: date | None = None
    status: RecordStatus = RecordStatus.DRAFT
    source: RecordSource = RecordSource.MANUAL
    steps: list[StepInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def ordered_steps(self):
        positions = [s.position for s in self.steps]
        if len(positions) != len(set(positions)):
            raise ValueError("Les positions des étapes doivent être uniques")
        return self


class ProcedureCreate(ProcedureBase):
    pass


class ProcedureUpdate(BaseModel):
    title: str | None = None
    objective: str | None = None
    department: str | None = None
    trigger: str | None = None
    responsible_user_id: str | None = None
    participants: list[str] | None = None
    tools: list[str] | None = None
    risks: list[str] | None = None
    expected_result: str | None = None
    validation_date: date | None = None
    next_review_date: date | None = None
    status: RecordStatus | None = None
    steps: list[StepInput] | None = None


class ProcedureRead(ProcedureBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    version: int
    is_archived: bool
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class HistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    record_type: str
    record_id: str
    action: str
    actor_user_id: str
    changes: dict[str, object]
    created_at: datetime
