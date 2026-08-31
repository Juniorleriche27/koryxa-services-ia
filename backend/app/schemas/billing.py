from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

PlanType = Literal["trial", "starter", "business", "pro"]
StatusType = Literal["trial", "active", "past_due", "suspended"]


class BillingPlanOffer(BaseModel):
    code: str
    name: str
    plan: PlanType
    period_months: int
    amount_minor: int
    currency: str = "XOF"
    display_price: str
    is_launch_deal: bool = False
    original_price: str | None = None
    features: list[str]
    max_senders: int


class BillingCheckoutRequest(BaseModel):
    product_code: str = Field(
        description="Ex: pack_starter_3m, pack_business_3m, pack_starter_1m, pack_business_1m"
    )
    provider: str = Field(
        default="leekpay", description="Passerelle de paiement (ex: leekpay pour Wave/Orange/MTN)"
    )
    customer_phone: str | None = Field(default=None, description="Numéro Mobile Money du client")
    customer_email: str | None = Field(default=None, description="Email du client")


class BillingCheckoutResponse(BaseModel):
    checkout_url: str
    payment_id: str | None = None
    idempotency_key: str
    product_code: str
    amount_minor: int
    currency: str


class BillingStatusResponse(BaseModel):
    subscription_plan: str
    subscription_status: str
    subscription_period_months: int
    subscription_ends_at: datetime | None = None
    days_remaining: int | None = None
    max_authorized_senders: int
    active_senders_count: int
    is_trial: bool
    is_active: bool
    available_plans: list[BillingPlanOffer]


class BillingWebhookPayload(BaseModel):
    event: str | None = None
    status: str
    product_code: str | None = None
    customer_id: str | None = None
    amount_minor: int | None = None
    currency: str | None = None
    idempotency_key: str | None = None
    payment_id: str | None = None
    transaction_id: str | None = None
    provider: str | None = None
