import re
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.registers import (
    DocumentType,
    ExpenseDocumentType,
    PaymentStatus,
    RecordSource,
    RecordStatus,
)


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
    track_stock: bool = False
    stock_quantity: Decimal = Field(default=Decimal("0.00"), ge=0)
    min_stock_alert: Decimal = Field(default=Decimal("5.00"), ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
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
    track_stock: bool | None = None
    stock_quantity: Decimal | None = Field(default=None, ge=0)
    min_stock_alert: Decimal | None = Field(default=None, ge=0)
    cost_price: Decimal | None = Field(default=None, ge=0)
    responsible_user_id: str | None = None
    status: RecordStatus | None = None
    effective_from: date | None = None
    expires_at: date | None = None


class StockAdjustmentRequest(BaseModel):
    quantity_delta: Decimal = Field(..., description="Positive to add stock, negative to remove")
    reason: str = Field(default="reassort", max_length=100)
    notes: str | None = None


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
    reference: str | None = Field(default=None, max_length=100)
    document_type: DocumentType = DocumentType.INVOICE
    sale_date: date
    client_name: str | None = None
    client_phone: str | None = None
    client_email: str | None = None
    offer_id: str | None = None
    item_label: str = Field(min_length=1, max_length=180)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)
    paid_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    due_date: date | None = None
    deposit_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    payment_method: str | None = None
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    payment_history: list[dict] = Field(default_factory=list)
    seller_user_id: str | None = None
    sales_channel: str | None = None
    comment: str | None = None
    status: RecordStatus = RecordStatus.DRAFT
    source: RecordSource = RecordSource.MANUAL

    @field_validator("client_phone")
    @classmethod
    def validate_client_phone(cls, v: str | None) -> str | None:
        if not v or not v.strip():
            return None
        clean = v.strip()
        if not clean.startswith("+") and not clean.startswith("00"):
            raise ValueError(
                "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +225..., +33..., +221...)."
            )
        digits = re.sub(r"[^0-9]", "", clean)
        if len(digits) < 7 or len(digits) > 15:
            raise ValueError(
                "Le numéro WhatsApp international doit comporter entre 7 et 15 chiffres."
            )
        return f"+{digits}"


class SaleCreate(SaleBase):
    reference: str | None = Field(default=None, max_length=100)


class SaleUpdate(BaseModel):
    reference: str | None = Field(default=None, max_length=100)
    document_type: DocumentType | None = None
    sale_date: date | None = None
    client_name: str | None = None
    client_phone: str | None = None
    client_email: str | None = None
    offer_id: str | None = None
    item_label: str | None = None
    quantity: Decimal | None = Field(default=None, gt=0)
    unit_price: Decimal | None = Field(default=None, ge=0)
    discount: Decimal | None = Field(default=None, ge=0)
    total_amount: Decimal | None = Field(default=None, ge=0)
    paid_amount: Decimal | None = Field(default=None, ge=0)
    due_date: date | None = None
    deposit_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    currency: str | None = None
    payment_method: str | None = None
    payment_status: PaymentStatus | None = None
    payment_history: list[dict] | None = None
    seller_user_id: str | None = None
    sales_channel: str | None = None
    comment: str | None = None
    status: RecordStatus | None = None

    @field_validator("client_phone")
    @classmethod
    def validate_client_phone(cls, v: str | None) -> str | None:
        if not v or not v.strip():
            return None
        clean = v.strip()
        if not clean.startswith("+") and not clean.startswith("00"):
            raise ValueError(
                "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +225..., +33..., +221...)."
            )
        digits = re.sub(r"[^0-9]", "", clean)
        if len(digits) < 7 or len(digits) > 15:
            raise ValueError(
                "Le numéro WhatsApp international doit comporter entre 7 et 15 chiffres."
            )
        return f"+{digits}"


class RecordPaymentRequest(BaseModel):
    amount: Decimal = Field(gt=0, description="Montant encaissé (acompte ou solde)")
    payment_method: str = Field(default="Espèces", max_length=80)
    payment_date: date | None = None
    comment: str | None = None


class ConvertDocumentRequest(BaseModel):
    target_type: DocumentType
    due_date: date | None = None


class ReferenceGenerationResponse(BaseModel):
    reference: str
    document_type: str


class SaleRead(SaleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    total_amount: Decimal
    paid_amount: Decimal
    is_archived: bool
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class StepInput(BaseModel):
    # Accept SQLAlchemy ProcedureStep instances when serializing API responses.
    # Incoming procedure payloads continue to be validated normally.
    model_config = ConfigDict(from_attributes=True)

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


class SalePaymentUpdate(BaseModel):
    payment_status: PaymentStatus
    payment_method: str | None = None


class RegistersSummary(BaseModel):
    total_sales_count: int
    total_sales_amount: Decimal
    total_paid_amount: Decimal
    total_unpaid_amount: Decimal
    total_partial_amount: Decimal
    offers_count: int
    procedures_count: int
    expenses_count: int = 0
    suppliers_count: int = 0
    total_expenses_paid: Decimal = Decimal("0.00")
    total_expenses_unpaid: Decimal = Decimal("0.00")
    net_cash_position: Decimal = Decimal("0.00")
    total_stock_value: Decimal = Decimal("0.00")
    low_stock_count: int = 0
    active_products_count: int = 0
    present_employees_today_count: int = 0
    primary_currency: str = "XOF"
    recent_sales: list[SaleRead] = Field(default_factory=list)


class ExpenseBase(BaseModel):
    reference: str | None = Field(default=None, max_length=100)
    document_type: ExpenseDocumentType = ExpenseDocumentType.EXPENSE_RECEIPT
    expense_date: date
    category: str = Field(default="Divers", max_length=80)
    beneficiary: str = Field(min_length=1, max_length=180)
    amount: Decimal = Field(gt=0)
    paid_amount: Decimal | None = None
    due_date: date | None = None
    currency: str = Field(default="XOF", min_length=3, max_length=3)
    payment_method: str | None = None
    payment_status: PaymentStatus = PaymentStatus.PAID
    invoice_number: str | None = None
    comment: str | None = None
    status: RecordStatus = RecordStatus.VALIDATED
    source: RecordSource = RecordSource.MANUAL


class ExpenseCreate(ExpenseBase):
    reference: str | None = Field(default=None, max_length=100)


class ExpenseUpdate(BaseModel):
    reference: str | None = None
    document_type: ExpenseDocumentType | None = None
    expense_date: date | None = None
    category: str | None = None
    beneficiary: str | None = None
    amount: Decimal | None = Field(default=None, gt=0)
    paid_amount: Decimal | None = None
    due_date: date | None = None
    currency: str | None = None
    payment_method: str | None = None
    payment_status: PaymentStatus | None = None
    invoice_number: str | None = None
    comment: str | None = None
    status: RecordStatus | None = None


class ExpensePaymentUpdate(BaseModel):
    payment_status: PaymentStatus
    payment_method: str | None = None
    paid_amount: Decimal | None = None


class ExpenseRead(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    is_archived: bool
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class SupplierBase(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    category: str | None = "Général"
    contact_name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    payment_terms: str | None = "Comptant"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    contact_name: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    payment_terms: str | None = None


class SupplierRead(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_id: str
    created_by_user_id: str
    updated_by_user_id: str
    created_at: datetime
    updated_at: datetime


class CashflowSummary(BaseModel):
    total_income_paid: Decimal
    total_income_unpaid: Decimal
    total_expenses_paid: Decimal
    total_expenses_unpaid: Decimal
    net_cash_position: Decimal
    projected_30d_cash: Decimal
    estimated_gross_margin: Decimal
    primary_currency: str = "XOF"
    recent_expenses: list[ExpenseRead] = Field(default_factory=list)
