from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.types import SafeStrEnum


class RecordStatus(StrEnum):
    DRAFT = "draft"
    TO_VERIFY = "to_verify"
    VALIDATED = "validated"
    OBSOLETE = "obsolete"
    ARCHIVED = "archived"
    CONFLICT = "conflict"


class RecordSource(StrEnum):
    MANUAL = "manual"
    EXCEL = "excel"
    DOCUMENT = "document"
    VOICE = "voice"
    PHOTO = "photo"
    INTEGRATION = "integration"
    AI = "ai"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class DocumentType(StrEnum):
    QUOTE = "quote"  # Devis
    PROFORMA = "proforma"  # Facture Pro Forma
    INVOICE = "invoice"  # Facture
    RECEIPT = "receipt"  # Reçu / Facture Acquittée


class ExpenseDocumentType(StrEnum):
    EXPENSE_RECEIPT = "expense_receipt"  # Reçu d'achat / Justificatif
    SUPPLIER_INVOICE = "supplier_invoice"  # Facture fournisseur
    VOUCHER = "voucher"  # Bon de caisse / Décaissement


def str_enum_type(enum_cls: type[StrEnum], length: int = 40, **kwargs: Any) -> SafeStrEnum:
    return SafeStrEnum(enum_cls, length=length)


class Offer(Base):
    __tablename__ = "offers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(180), index=True)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100), index=True)
    price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    currency: Mapped[str] = mapped_column(String(3), default="XOF")
    billing_unit: Mapped[str | None] = mapped_column(String(80))
    conditions: Mapped[str | None] = mapped_column(Text)
    inclusions: Mapped[list[str]] = mapped_column(JSON, default=list)
    exclusions: Mapped[list[str]] = mapped_column(JSON, default=list)
    track_stock: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    min_stock_alert: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("5.00"))
    cost_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    responsible_user_id: Mapped[str | None] = mapped_column(String(128), index=True)
    status: Mapped[RecordStatus] = mapped_column(
        str_enum_type(RecordStatus), default=RecordStatus.DRAFT, index=True
    )
    source: Mapped[RecordSource] = mapped_column(
        str_enum_type(RecordSource), default=RecordSource.MANUAL
    )
    effective_from: Mapped[date | None] = mapped_column(Date)
    expires_at: Mapped[date | None] = mapped_column(Date)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Sale(Base):
    __tablename__ = "sales"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    reference: Mapped[str] = mapped_column(String(100), index=True)
    sale_date: Mapped[date] = mapped_column(Date, index=True)
    client_name: Mapped[str | None] = mapped_column(String(180), index=True)
    client_phone: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    client_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    offer_id: Mapped[str | None] = mapped_column(
        ForeignKey("offers.id", ondelete="SET NULL"), index=True
    )
    item_label: Mapped[str] = mapped_column(String(180), index=True)
    document_type: Mapped[DocumentType] = mapped_column(
        str_enum_type(DocumentType), default=DocumentType.INVOICE, index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 3), default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    discount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"))
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    deposit_percentage: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="XOF")
    payment_method: Mapped[str | None] = mapped_column(String(80), index=True)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        str_enum_type(PaymentStatus), default=PaymentStatus.UNPAID, index=True
    )
    payment_history: Mapped[list[dict]] = mapped_column(JSON, default=list)
    seller_user_id: Mapped[str | None] = mapped_column(String(128), index=True)
    sales_channel: Mapped[str | None] = mapped_column(String(80), index=True)
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RecordStatus] = mapped_column(
        str_enum_type(RecordStatus), default=RecordStatus.DRAFT, index=True
    )
    source: Mapped[RecordSource] = mapped_column(
        str_enum_type(RecordSource), default=RecordSource.MANUAL
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Procedure(Base):
    __tablename__ = "procedures"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(180), index=True)
    objective: Mapped[str | None] = mapped_column(Text)
    department: Mapped[str | None] = mapped_column(String(100), index=True)
    trigger: Mapped[str | None] = mapped_column(Text)
    responsible_user_id: Mapped[str | None] = mapped_column(String(128), index=True)
    participants: Mapped[list[str]] = mapped_column(JSON, default=list)
    tools: Mapped[list[str]] = mapped_column(JSON, default=list)
    risks: Mapped[list[str]] = mapped_column(JSON, default=list)
    expected_result: Mapped[str | None] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, default=1)
    validation_date: Mapped[date | None] = mapped_column(Date)
    next_review_date: Mapped[date | None] = mapped_column(Date, index=True)
    status: Mapped[RecordStatus] = mapped_column(
        str_enum_type(RecordStatus), default=RecordStatus.DRAFT, index=True
    )
    source: Mapped[RecordSource] = mapped_column(
        str_enum_type(RecordSource), default=RecordSource.MANUAL
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ProcedureStep(Base):
    __tablename__ = "procedure_steps"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    procedure_id: Mapped[str] = mapped_column(
        ForeignKey("procedures.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str | None] = mapped_column(Text)


class RecordHistory(Base):
    __tablename__ = "record_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    record_type: Mapped[str] = mapped_column(String(40), index=True)
    record_id: Mapped[str] = mapped_column(String(36), index=True)
    action: Mapped[str] = mapped_column(String(40))
    actor_user_id: Mapped[str] = mapped_column(String(128), index=True)
    changes: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class Expense(Base):
    __tablename__ = "expenses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    reference: Mapped[str] = mapped_column(String(100), index=True)
    expense_date: Mapped[date] = mapped_column(Date, index=True)
    document_type: Mapped[ExpenseDocumentType] = mapped_column(
        str_enum_type(ExpenseDocumentType),
        default=ExpenseDocumentType.EXPENSE_RECEIPT,
        index=True,
    )
    category: Mapped[str] = mapped_column(String(80), index=True, default="Divers")
    beneficiary: Mapped[str] = mapped_column(String(180), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    paid_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    currency: Mapped[str] = mapped_column(String(3), default="XOF")
    payment_method: Mapped[str | None] = mapped_column(String(80))
    payment_status: Mapped[PaymentStatus] = mapped_column(
        str_enum_type(PaymentStatus), default=PaymentStatus.PAID, index=True
    )
    invoice_number: Mapped[str | None] = mapped_column(String(120))
    comment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RecordStatus] = mapped_column(
        str_enum_type(RecordStatus), default=RecordStatus.VALIDATED, index=True
    )
    source: Mapped[RecordSource] = mapped_column(
        str_enum_type(RecordSource), default=RecordSource.MANUAL
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Supplier(Base):
    __tablename__ = "suppliers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(180), index=True)
    category: Mapped[str | None] = mapped_column(String(100), default="Général")
    contact_name: Mapped[str | None] = mapped_column(String(180))
    phone: Mapped[str | None] = mapped_column(String(80))
    email: Mapped[str | None] = mapped_column(String(180))
    address: Mapped[str | None] = mapped_column(Text)
    payment_terms: Mapped[str | None] = mapped_column(String(120), default="Comptant")
    created_by_user_id: Mapped[str] = mapped_column(String(128))
    updated_by_user_id: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
