from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class WhatsAppWebhookQuery(BaseModel):
    hub_mode: str | None = Field(default=None, alias="hub.mode")
    hub_verify_token: str | None = Field(default=None, alias="hub.verify_token")
    hub_challenge: str | None = Field(default=None, alias="hub.challenge")


class WhatsAppConfig(BaseModel):
    phone_number_id: str | None = None
    verify_token: str = "koryxa_secret_webhook_token"
    is_active: bool = True
    authorized_sender_numbers: list[str] = Field(default_factory=list)
    auto_reply_enabled: bool = True


class WhatsAppConfigUpdate(BaseModel):
    phone_number_id: str | None = None
    verify_token: str | None = None
    is_active: bool | None = None
    authorized_sender_numbers: list[str] | None = None
    auto_reply_enabled: bool | None = None


class WhatsAppInboundMessage(BaseModel):
    from_phone: str
    message_id: str
    text_content: str
    timestamp: str | None = None
    organization_id: str | None = None
