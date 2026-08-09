from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OrganizationIntegrationConfig(Base):
    __tablename__ = "organization_integration_configs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, index=True
    )
    ai_provider: Mapped[str] = mapped_column(String(30), default="knowlia", nullable=False)
    ai_model_name: Mapped[str] = mapped_column(String(120), default="llama3.2:3b", nullable=False)
    ai_temperature: Mapped[float] = mapped_column(Float, default=0.3, nullable=False)
    ai_custom_system_prompt: Mapped[str | None] = mapped_column(Text)
    knowlia_assistant_id: Mapped[str | None] = mapped_column(String(100))
    ai_api_key_encrypted: Mapped[str | None] = mapped_column(Text)
    whatsapp_phone_number_id: Mapped[str | None] = mapped_column(String(120), unique=True)
    whatsapp_verify_token_encrypted: Mapped[str | None] = mapped_column(Text)
    whatsapp_app_secret_encrypted: Mapped[str | None] = mapped_column(Text)
    whatsapp_access_token_encrypted: Mapped[str | None] = mapped_column(Text)
    whatsapp_authorized_senders: Mapped[list[str]] = mapped_column(
        JSON, default=list, nullable=False
    )
    whatsapp_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    whatsapp_auto_reply: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class WhatsAppWebhookEvent(Base):
    __tablename__ = "whatsapp_webhook_events"
    __table_args__ = (UniqueConstraint("message_id", name="uq_whatsapp_webhook_message_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    message_id: Mapped[str] = mapped_column(String(180), nullable=False)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
