from __future__ import annotations

from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.organization import Organization
from app.models.registers import RecordSource
from app.schemas.voice import VoiceConfirmRequest, VoiceParseRequest
from app.schemas.whatsapp import WhatsAppConfig, WhatsAppConfigUpdate
from app.services.voice import VoiceService

# In-memory tenant configs fallback for demonstration / testing
_ORG_CONFIGS: dict[str, WhatsAppConfig] = {}


class WhatsAppService:
    def __init__(self, voice_service: VoiceService | None = None) -> None:
        self.voice_service = voice_service or VoiceService()

    def verify_webhook(self, mode: str | None, token: str | None, challenge: str | None, expected_token: str = "koryxa_secret_webhook_token") -> str:
        if mode == "subscribe" and token == expected_token:
            return challenge or ""
        raise ApplicationError("invalid_verify_token", "Token de vérification WhatsApp invalide", 403)

    def get_config(self, org_id: str) -> WhatsAppConfig:
        if org_id not in _ORG_CONFIGS:
            _ORG_CONFIGS[org_id] = WhatsAppConfig()
        return _ORG_CONFIGS[org_id]

    def update_config(self, org_id: str, data: WhatsAppConfigUpdate) -> WhatsAppConfig:
        cfg = self.get_config(org_id)
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(cfg, k, v)
        _ORG_CONFIGS[org_id] = cfg
        return cfg

    async def process_inbound_payload(
        self, s: AsyncSession, payload: dict[str, Any], default_org: str | None = None
    ) -> dict[str, Any]:
        """Extrait les messages entrants WhatsApp Cloud API et les structure via VoiceService."""
        # Meta Cloud API structure: entry -> changes -> value -> messages
        entries = payload.get("entry", [])
        if not entries:
            # Direct simulation payload format
            text = payload.get("text", "")
            from_phone = payload.get("from", "+22501020304")
            org_id = payload.get("organization_id") or default_org
        else:
            value = entries[0].get("changes", [{}])[0].get("value", {})
            messages = value.get("messages", [])
            if not messages:
                return {"status": "no_messages"}
            msg = messages[0]
            from_phone = msg.get("from", "unknown")
            text = msg.get("text", {}).get("body", "")
            org_id = default_org

        resolved_org = None
        if org_id:
            resolved_org = await s.scalar(
                select(Organization).where(
                    (Organization.id == org_id)
                    | (Organization.tenant_id == org_id)
                    | (Organization.slug == org_id)
                )
            )
        if not resolved_org:
            resolved_org = await s.scalar(select(Organization).where(Organization.is_active.is_(True)))

        if not resolved_org:
            raise ApplicationError("org_not_found", "Organisation introuvable pour ce webhook", 404)

        org_id = resolved_org.id

        if not text:
            return {"status": "empty_content"}


        # Parse text/transcript using VoiceService
        parsed = self.voice_service.parse_transcript(VoiceParseRequest(transcript=text))

        created_info = None
        if parsed.sale:
            req = VoiceConfirmRequest(
                intent=parsed.intent,
                payload=parsed.sale.model_dump(),
                source=RecordSource.INTEGRATION,
            )
            created_info = await self.voice_service.confirm_record(s, org_id, f"whatsapp:{from_phone}", req)

        reply_text = (
            f"✅ KORYXA Service IA : Vente enregistrée avec succès !\n"
            f"• Réf : {created_info.get('reference') if created_info else 'N/A'}\n"
            f"• Total : {parsed.sale.total_amount if parsed.sale else 0} {parsed.sale.currency if parsed.sale else 'XOF'}\n"
            f"• Client : {parsed.sale.client_name if parsed.sale else 'Non renseigné'}\n"
            f"• Statut : {parsed.sale.payment_status if parsed.sale else 'Non payé'}"
        )

        return {
            "status": "processed",
            "from_phone": from_phone,
            "organization_id": org_id,
            "parsed_intent": parsed.intent,
            "record": created_info,
            "reply_message": reply_text,
        }
