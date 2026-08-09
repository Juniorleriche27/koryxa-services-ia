from __future__ import annotations

import hashlib
import hmac
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.integrations import OrganizationIntegrationConfig, WhatsAppWebhookEvent
from app.models.registers import RecordSource
from app.schemas.voice import VoiceConfirmRequest, VoiceParseRequest
from app.schemas.whatsapp import WhatsAppConfig, WhatsAppConfigUpdate
from app.services.integration_config import IntegrationConfigService
from app.services.voice import VoiceService


class WhatsAppService:
    def __init__(self, voice_service: VoiceService | None = None) -> None:
        self.voice_service = voice_service or VoiceService()
        self.configs = IntegrationConfigService()

    def public_config(self, cfg: OrganizationIntegrationConfig) -> WhatsAppConfig:
        return WhatsAppConfig(
            phone_number_id=cfg.whatsapp_phone_number_id,
            is_active=cfg.whatsapp_active,
            authorized_sender_numbers=cfg.whatsapp_authorized_senders or [],
            auto_reply_enabled=cfg.whatsapp_auto_reply,
            has_verify_token=bool(cfg.whatsapp_verify_token_encrypted),
            has_app_secret=bool(cfg.whatsapp_app_secret_encrypted),
            has_access_token=bool(cfg.whatsapp_access_token_encrypted),
        )

    async def get_config(self, s: AsyncSession, org_id: str) -> WhatsAppConfig:
        return self.public_config(await self.configs.get(s, org_id))

    async def update_config(
        self, s: AsyncSession, org_id: str, data: WhatsAppConfigUpdate
    ) -> WhatsAppConfig:
        cfg = await self.configs.get(s, org_id)
        values = data.model_dump(exclude_unset=True)
        for field, target in (
            ("verify_token", "whatsapp_verify_token_encrypted"),
            ("app_secret", "whatsapp_app_secret_encrypted"),
            ("access_token", "whatsapp_access_token_encrypted"),
        ):
            if field in values:
                setattr(cfg, target, self.configs.encrypt(values.pop(field)))
        mapping = {
            "phone_number_id": "whatsapp_phone_number_id",
            "is_active": "whatsapp_active",
            "authorized_sender_numbers": "whatsapp_authorized_senders",
            "auto_reply_enabled": "whatsapp_auto_reply",
        }
        for field, value in values.items():
            setattr(cfg, mapping[field], value)
        await s.commit()
        return self.public_config(cfg)

    async def verify_webhook(
        self, s: AsyncSession, mode: str | None, token: str | None, challenge: str | None
    ) -> str:
        if mode != "subscribe" or not token:
            raise ApplicationError(
                "invalid_verify_token", "Token de vérification WhatsApp invalide", 403
            )
        configs = (
            await s.scalars(
                select(OrganizationIntegrationConfig).where(
                    OrganizationIntegrationConfig.whatsapp_active.is_(True)
                )
            )
        ).all()
        if not any(
            hmac.compare_digest(
                token, self.configs.decrypt(cfg.whatsapp_verify_token_encrypted) or ""
            )
            for cfg in configs
        ):
            raise ApplicationError(
                "invalid_verify_token", "Token de vérification WhatsApp invalide", 403
            )
        return challenge or ""

    async def process_inbound_payload(
        self, s: AsyncSession, raw_body: bytes, signature: str | None, payload: dict[str, Any]
    ) -> dict[str, Any]:
        try:
            value = payload["entry"][0]["changes"][0]["value"]
            phone_id = str(value["metadata"]["phone_number_id"])
        except (KeyError, IndexError, TypeError):
            raise ApplicationError(
                "invalid_whatsapp_payload", "Payload WhatsApp invalide", 400
            ) from None
        cfg = await self.configs.by_phone(s, phone_id)
        if cfg is None:
            raise ApplicationError(
                "whatsapp_tenant_not_found", "Numéro WhatsApp non configuré", 404
            )
        app_secret = self.configs.decrypt(cfg.whatsapp_app_secret_encrypted)
        if not app_secret or not signature or not signature.startswith("sha256="):
            raise ApplicationError(
                "invalid_whatsapp_signature", "Signature WhatsApp absente ou invalide", 401
            )
        expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature[7:], expected):
            raise ApplicationError("invalid_whatsapp_signature", "Signature WhatsApp invalide", 401)
        messages = value.get("messages") or []
        if not messages:
            return {"status": "no_messages"}
        msg = messages[0]
        message_id = str(msg.get("id") or "")
        if not message_id:
            raise ApplicationError(
                "invalid_whatsapp_payload", "Identifiant de message manquant", 400
            )
        if await s.scalar(
            select(WhatsAppWebhookEvent).where(WhatsAppWebhookEvent.message_id == message_id)
        ):
            return {"status": "duplicate"}
        from_phone = str(msg.get("from") or "")
        if cfg.whatsapp_authorized_senders and from_phone not in cfg.whatsapp_authorized_senders:
            raise ApplicationError(
                "whatsapp_sender_forbidden", "Expéditeur WhatsApp non autorisé", 403
            )
        text = str((msg.get("text") or {}).get("body") or "").strip()
        s.add(WhatsAppWebhookEvent(organization_id=cfg.organization_id, message_id=message_id))
        if not text:
            await s.commit()
            return {"status": "empty_content"}
        parsed = self.voice_service.parse_transcript(VoiceParseRequest(transcript=text))
        created = None
        if parsed.sale:
            created = await self.voice_service.confirm_record(
                s,
                cfg.organization_id,
                f"whatsapp:{from_phone}",
                VoiceConfirmRequest(
                    intent=parsed.intent,
                    payload=parsed.sale.model_dump(),
                    source=RecordSource.INTEGRATION,
                ),
            )
        await s.commit()
        return {
            "status": "processed",
            "from_phone": from_phone,
            "organization_id": cfg.organization_id,
            "parsed_intent": parsed.intent,
            "record": created,
        }
