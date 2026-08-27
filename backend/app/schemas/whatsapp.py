from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class WhatsAppWebhookQuery(BaseModel):
    hub_mode: str | None = Field(default=None, alias="hub.mode")
    hub_verify_token: str | None = Field(default=None, alias="hub.verify_token")
    hub_challenge: str | None = Field(default=None, alias="hub.challenge")


class WhatsAppAuthorizedSenderCreate(BaseModel):
    phone_number: str = Field(min_length=6, max_length=32, description="Numéro au format E.164 (+225...)")
    label: str | None = Field(default=None, max_length=100, description="Nom ou rôle du collaborateur")
    is_active: bool = True


class WhatsAppAuthorizedSenderUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=100)
    is_active: bool | None = None


class WhatsAppAuthorizedSenderRead(BaseModel):
    id: str
    organization_id: str
    phone_number: str
    label: str | None = None
    is_active: bool
    created_by_user_id: str
    created_at: datetime
    updated_at: datetime


class WhatsAppAuthorizedSenderList(BaseModel):
    items: list[WhatsAppAuthorizedSenderRead]
    total: int


class WhatsAppConfig(BaseModel):
    phone_number_id: str | None = None
    connection_mode: str = "meta_api"
    business_account_id: str | None = None
    api_version: str = "v21.0"
    unauthorized_reply: str | None = None
    is_active: bool = False
    authorized_sender_numbers: list[str] = Field(default_factory=list)
    authorized_senders: list[WhatsAppAuthorizedSenderRead] = Field(default_factory=list)
    auto_reply_enabled: bool = True
    has_verify_token: bool = False
    has_app_secret: bool = False
    has_access_token: bool = False


class WhatsAppConfigUpdate(BaseModel):
    phone_number_id: str | None = None
    connection_mode: str | None = None
    business_account_id: str | None = None
    api_version: str | None = None
    unauthorized_reply: str | None = None
    verify_token: str | None = None
    app_secret: str | None = None
    access_token: str | None = None
    is_active: bool | None = None
    authorized_sender_numbers: list[str] | None = None
    auto_reply_enabled: bool | None = None


class WhatsAppInboundMessage(BaseModel):
    from_phone: str
    message_id: str
    text_content: str
    timestamp: str | None = None
    organization_id: str | None = None
