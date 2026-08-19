from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

from app.models.registers import PaymentStatus, RecordSource


class VoiceIntent(StrEnum):
    SALE = "sale"
    OFFER = "offer"
    PROCEDURE = "procedure"
    UNKNOWN = "unknown"


class VoiceParseRequest(BaseModel):
    transcript: str = Field(min_length=2, max_length=5000)
    audio_base64: str | None = None
    source_language: str = "fr"


class VoiceSaleCandidate(BaseModel):
    reference: str
    sale_date: date
    client_name: str | None = None
    item_label: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    total_amount: Decimal = Decimal("0")
    currency: str = "XOF"
    payment_method: str | None = None
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    sales_channel: str | None = "Vocal"
    comment: str | None = None


class VoiceOfferCandidate(BaseModel):
    name: str
    category: str | None = None
    price: Decimal | None = None
    currency: str = "XOF"
    billing_unit: str | None = None
    conditions: str | None = None


class VoiceProcedureCandidate(BaseModel):
    title: str
    department: str | None = None
    objective: str | None = None
    steps: list[dict[str, Any]] = Field(default_factory=list)


class VoiceParseResponse(BaseModel):
    intent: VoiceIntent
    confidence: float
    original_transcript: str
    sale: VoiceSaleCandidate | None = None
    offer: VoiceOfferCandidate | None = None
    procedure: VoiceProcedureCandidate | None = None
    extracted_entities: dict[str, Any] = Field(default_factory=dict)
    summary_message: str


class VoiceConfirmRequest(BaseModel):
    intent: VoiceIntent
    payload: dict[str, Any]
    source: RecordSource = RecordSource.VOICE


class VoiceTranscriptionResponse(BaseModel):
    transcript: str
    confidence: float = 0.95
    engine: str = "Whisper AI HD"
    duration_seconds: float | None = None
