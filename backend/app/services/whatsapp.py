from __future__ import annotations

import hashlib
import hmac
from decimal import Decimal
from typing import Any
from uuid import uuid4

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.errors import ApplicationError
from app.models.integrations import (
    OrganizationIntegrationConfig,
    WhatsAppAuthorizedSender,
    WhatsAppWebhookEvent,
)
from app.models.organization import Organization
from app.models.registers import Expense, Offer, PaymentStatus, RecordSource, Sale
from app.schemas.voice import VoiceConfirmRequest, VoiceParseRequest
from app.schemas.whatsapp import (
    WhatsAppAuthorizedSenderCreate,
    WhatsAppAuthorizedSenderRead,
    WhatsAppAuthorizedSenderUpdate,
    WhatsAppConfig,
    WhatsAppConfigUpdate,
)
from app.services.integration_config import IntegrationConfigService
from app.services.voice import VoiceService


def normalize_e164(raw_phone: str) -> str:
    """Normalise un numéro de téléphone au standard international E.164 (+2250708091011)."""
    if not raw_phone:
        return ""
    cleaned = str(raw_phone).strip()
    for suffix in ("@s.whatsapp.net", "@c.us", "@lid", "@broadcast", "@newsletter"):
        cleaned = cleaned.replace(suffix, "")
    digits = "".join(c for c in cleaned if c.isdigit() or c == "+")
    if digits.startswith("00"):
        digits = "+" + digits[2:]
    elif not digits.startswith("+") and digits:
        digits = "+" + digits
    return digits


class WhatsAppService:
    def __init__(self, voice_service: VoiceService | None = None) -> None:
        self.voice_service = voice_service or VoiceService()
        self.configs = IntegrationConfigService()

    def public_config(
        self,
        cfg: OrganizationIntegrationConfig,
        senders: list[WhatsAppAuthorizedSender] | None = None,
    ) -> WhatsAppConfig:
        sender_reads = [
            WhatsAppAuthorizedSenderRead(
                id=s.id,
                organization_id=s.organization_id,
                phone_number=s.phone_number,
                whatsapp_lid=s.whatsapp_lid,
                label=s.label,
                is_active=s.is_active,
                created_by_user_id=s.created_by_user_id,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in (senders or [])
        ]
        return WhatsAppConfig(
            phone_number_id=cfg.whatsapp_phone_number_id,
            connection_mode=cfg.whatsapp_connection_mode or "meta_api",
            business_account_id=cfg.whatsapp_business_account_id,
            api_version=cfg.whatsapp_api_version or "v21.0",
            unauthorized_reply=cfg.whatsapp_unauthorized_reply,
            is_active=cfg.whatsapp_active,
            authorized_sender_numbers=cfg.whatsapp_authorized_senders or [],
            authorized_senders=sender_reads,
            auto_reply_enabled=cfg.whatsapp_auto_reply,
            has_verify_token=bool(cfg.whatsapp_verify_token_encrypted),
            has_app_secret=bool(cfg.whatsapp_app_secret_encrypted),
            has_access_token=bool(cfg.whatsapp_access_token_encrypted),
        )

    async def get_config(self, s: AsyncSession, org_id: str) -> WhatsAppConfig:
        cfg = await self.configs.get(s, org_id)
        senders = await self.list_authorized_senders(s, org_id)
        return self.public_config(cfg, senders)

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
                raw_val = values.pop(field)
                if raw_val is not None and str(raw_val).strip():
                    setattr(cfg, target, self.configs.encrypt(str(raw_val).strip()))
        mapping = {
            "phone_number_id": "whatsapp_phone_number_id",
            "connection_mode": "whatsapp_connection_mode",
            "business_account_id": "whatsapp_business_account_id",
            "api_version": "whatsapp_api_version",
            "unauthorized_reply": "whatsapp_unauthorized_reply",
            "is_active": "whatsapp_active",
            "authorized_sender_numbers": "whatsapp_authorized_senders",
            "auto_reply_enabled": "whatsapp_auto_reply",
        }
        for field, value in values.items():
            if field in mapping and value is not None:
                setattr(cfg, mapping[field], value)
        await s.commit()
        senders = await self.list_authorized_senders(s, org_id)
        return self.public_config(cfg, senders)

    async def list_authorized_senders(
        self, s: AsyncSession, org_id: str
    ) -> list[WhatsAppAuthorizedSender]:
        return list(
            (
                await s.scalars(
                    select(WhatsAppAuthorizedSender)
                    .where(WhatsAppAuthorizedSender.organization_id == org_id)
                    .order_by(WhatsAppAuthorizedSender.created_at.desc())
                )
            ).all()
        )

    async def add_authorized_sender(
        self,
        s: AsyncSession,
        org_id: str,
        user_id: str,
        data: WhatsAppAuthorizedSenderCreate,
    ) -> WhatsAppAuthorizedSender:
        phone_norm = normalize_e164(data.phone_number)
        if not phone_norm or len(phone_norm) < 7:
            raise ApplicationError(
                "invalid_phone_number",
                "Numéro de téléphone invalide (format international E.164 requis ex: +2250708091011)",
                400,
            )

        existing = await s.scalar(
            select(WhatsAppAuthorizedSender).where(
                WhatsAppAuthorizedSender.organization_id == org_id,
                WhatsAppAuthorizedSender.phone_number == phone_norm,
            )
        )
        if existing:
            raise ApplicationError(
                "duplicate_phone_number",
                "Ce numéro est déjà configuré pour cette organisation.",
                409,
            )

        sender = WhatsAppAuthorizedSender(
            organization_id=org_id,
            phone_number=phone_norm,
            whatsapp_lid=data.whatsapp_lid.replace("@lid", "").strip() if data.whatsapp_lid else None,
            label=data.label,
            is_active=data.is_active,
            created_by_user_id=user_id,
        )
        s.add(sender)
        await s.commit()
        await s.refresh(sender)
        return sender

    async def update_authorized_sender(
        self,
        s: AsyncSession,
        org_id: str,
        sender_id: str,
        data: WhatsAppAuthorizedSenderUpdate,
    ) -> WhatsAppAuthorizedSender:
        sender = await s.scalar(
            select(WhatsAppAuthorizedSender).where(
                WhatsAppAuthorizedSender.id == sender_id,
                WhatsAppAuthorizedSender.organization_id == org_id,
            )
        )
        if not sender:
            raise ApplicationError(
                "authorized_sender_not_found", "Numéro autorisé introuvable", 404
            )
        if data.whatsapp_lid is not None:
            sender.whatsapp_lid = data.whatsapp_lid.replace("@lid", "").strip() if data.whatsapp_lid else None
        if data.label is not None:
            sender.label = data.label
        if data.is_active is not None:
            sender.is_active = data.is_active
        await s.commit()
        await s.refresh(sender)
        return sender

    async def delete_authorized_sender(
        self, s: AsyncSession, org_id: str, sender_id: str
    ) -> bool:
        sender = await s.scalar(
            select(WhatsAppAuthorizedSender).where(
                WhatsAppAuthorizedSender.id == sender_id,
                WhatsAppAuthorizedSender.organization_id == org_id,
            )
        )
        if not sender:
            raise ApplicationError(
                "authorized_sender_not_found", "Numéro autorisé introuvable", 404
            )
        await s.delete(sender)
        await s.commit()
        return True

    async def is_sender_authorized(
        self,
        s: AsyncSession,
        org_id: str,
        raw_phone: str,
        cfg: OrganizationIntegrationConfig | None = None,
        sender_lid: str | None = None,
    ) -> bool:
        clean_phone = normalize_e164(raw_phone)
        clean_lid = str(sender_lid).replace("@lid", "").strip() if sender_lid else None

        if not clean_phone and not clean_lid:
            return False

        # 1. Vérifier la table dédiée des numéros autorisés (par numéro E.164 ou LID vérifié)
        stmt = select(WhatsAppAuthorizedSender).where(
            WhatsAppAuthorizedSender.organization_id == org_id,
            WhatsAppAuthorizedSender.is_active.is_(True),
        )
        if clean_phone and clean_lid:
            stmt = stmt.where(
                (WhatsAppAuthorizedSender.phone_number == clean_phone)
                | (WhatsAppAuthorizedSender.whatsapp_lid == clean_lid)
            )
        elif clean_phone:
            stmt = stmt.where(WhatsAppAuthorizedSender.phone_number == clean_phone)
        elif clean_lid:
            stmt = stmt.where(WhatsAppAuthorizedSender.whatsapp_lid == clean_lid)

        authorized_row = await s.scalar(stmt)
        if authorized_row is not None:
            return True

        # 2. Rétro-compatibilité : liste JSON historique dans la configuration
        if cfg and cfg.whatsapp_authorized_senders and clean_phone:
            for legacy_num in cfg.whatsapp_authorized_senders:
                if normalize_e164(legacy_num) == clean_phone:
                    return True

        # FERMÉ PAR DÉFAUT (Zero Trust) : Aucun numéro n'est autorisé sans inscription explicite
        return False

    async def test_connection(self, s: AsyncSession, org_id: str) -> dict[str, Any]:
        """Vérifie la validité des identifiants auprès de l'API Meta Cloud."""
        cfg = await self.configs.get(s, org_id)
        phone_id = cfg.whatsapp_phone_number_id
        access_token = self.configs.decrypt(cfg.whatsapp_access_token_encrypted)

        if not phone_id or not access_token:
            raise ApplicationError(
                "whatsapp_not_configured",
                "Phone Number ID ou Access Token manquant pour cette organisation.",
                400,
            )

        api_ver = cfg.whatsapp_api_version or "v21.0"
        url = f"https://graph.facebook.com/{api_ver}/{phone_id}"
        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    meta_info = resp.json()
                    return {
                        "status": "connected",
                        "message": "Connexion Meta Cloud API établie avec succès.",
                        "phone_id": phone_id,
                        "display_phone_number": meta_info.get("display_phone_number"),
                        "verified_name": meta_info.get("verified_name"),
                        "quality_rating": meta_info.get("quality_rating"),
                    }
                else:
                    error_data = resp.json().get("error", {})
                    return {
                        "status": "error",
                        "message": error_data.get("message", f"Erreur Meta HTTP {resp.status_code}"),
                        "error_code": error_data.get("code"),
                    }
        except Exception as exc:
            return {
                "status": "network_error",
                "message": f"Impossible de joindre les serveurs Meta : {exc}",
            }

    async def send_reply(
        self, phone_id: str, access_token: str, to_phone: str, message: str, api_version: str = "v21.0"
    ) -> bool:
        """Envoie un message sortant via l'API Meta WhatsApp Cloud."""
        if not phone_id or not access_token or not to_phone or not message:
            return False
        clean_to = to_phone.replace("+", "").replace(" ", "").strip()
        url = f"https://graph.facebook.com/{api_version}/{phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_to,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                return res.status_code in (200, 201)
        except Exception:
            return False

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

    async def _handle_conversational_query(
        self, s: AsyncSession, org_id: str, query: str
    ) -> str:
        """Interroge la base de connaissances et les registres pour formuler une réponse WhatsApp."""
        lower = query.lower()

        # 1. Questions sur le solde de caisse / trésorerie
        if any(w in lower for w in ["solde", "caisse", "trésorerie", "tresorerie", "disponible", "liquidité", "liquidite"]):
            total_collected = await s.scalar(
                select(func.sum(Sale.total_amount)).where(
                    Sale.organization_id == org_id,
                    Sale.payment_status == PaymentStatus.PAID,
                    Sale.is_archived.is_(False),
                )
            ) or Decimal("0")
            total_expenses = await s.scalar(
                select(func.sum(Expense.amount)).where(
                    Expense.organization_id == org_id,
                    Expense.is_archived.is_(False),
                )
            ) or Decimal("0")
            solde = total_collected - total_expenses
            return (
                f"🏦 *Diagnostic Trésorerie & Caisse KORYXA*\n\n"
                f"• 💰 Total Encaissé Réel : {float(total_collected):,.0f} XOF\n"
                f"• 📤 Total Charges Payées : {float(total_expenses):,.0f} XOF\n"
                f"• 🏦 Solde Réel Disponible : *{float(solde):,.0f} XOF*\n\n"
                f"💡 _Votre trésorerie est saine et à jour._"
            )

        # 2. Questions sur les ventes du jour / totales
        if any(w in lower for w in ["combien", "total", "chiffre", "ca", "ventes", "recette", "bilan"]):
            total_sales = await s.scalar(
                select(func.count(Sale.id)).where(
                    Sale.organization_id == org_id, Sale.is_archived.is_(False)
                )
            ) or 0
            total_amount = await s.scalar(
                select(func.sum(Sale.total_amount)).where(
                    Sale.organization_id == org_id,
                    Sale.payment_status == PaymentStatus.PAID,
                    Sale.is_archived.is_(False),
                )
            ) or Decimal("0")
            return (
                f"📊 *Point d'activité KORYXA*\n\n"
                f"• Nombre total de ventes enregistrées : {total_sales}\n"
                f"• Encaissements confirmés : {float(total_amount):,.0f} XOF\n\n"
                f"Pour déclarer une nouvelle vente, envoyez simplement : 'Vente [produit] [montant] client [nom]'"
            )

        # 3. Questions sur les offres / tarifs
        if any(w in lower for w in ["tarif", "prix", "offre", "catalogue"]):
            offers = list(
                (
                    await s.scalars(
                        select(Offer)
                        .where(Offer.organization_id == org_id, Offer.is_archived.is_(False))
                        .limit(5)
                    )
                ).all()
            )
            if not offers:
                return "ℹ️ Aucune offre active n'est enregistrée dans le catalogue pour le moment."
            lines = ["📋 *Catalogue des offres officielles :*"]
            for o in offers:
                price_str = f"{o.price:,.0f} {o.currency}" if o.price else "Sur devis"
                lines.append(f"• *{o.name}* : {price_str} ({o.category or 'Général'})")
            return "\n".join(lines)

        return (
            "👋 Bonjour ! Je suis l'assistant opérationnel KORYXA de votre entreprise.\n\n"
            "Vous pouvez m'envoyer :\n"
            "1. Une note de vente (ex: *Vente 3 cartons à 45000 client Koffi*)\n"
            "2. Une question sur vos tarifs (ex: *Quel est le prix de la formation ?*)\n"
            "3. Une question sur votre activité (ex: *Quel est le CA du mois ?*)"
        )

    async def process_inbound_payload(
        self,
        s: AsyncSession,
        raw_body: bytes,
        signature: str | None,
        payload: dict[str, Any],
        internal_secret: str | None = None,
    ) -> dict[str, Any]:
        cfg = None
        if "entry" in payload:
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
            if not app_secret:
                raise ApplicationError(
                    "whatsapp_app_secret_missing",
                    "Secret applicatif WhatsApp non configuré",
                    503,
                )
            if not signature or not signature.startswith("sha256="):
                raise ApplicationError(
                    "missing_whatsapp_signature", "Signature WhatsApp manquante", 401
                )
            expected = hmac.new(app_secret.encode(), raw_body, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(signature[7:], expected):
                raise ApplicationError(
                    "invalid_whatsapp_signature", "Signature WhatsApp invalide", 401
                )
            messages = value.get("messages") or []
            if not messages:
                return {"status": "no_messages"}
            msg = messages[0]
            message_id = str(msg.get("id") or "")
            if not message_id:
                raise ApplicationError(
                    "invalid_whatsapp_payload", "Identifiant de message manquant", 400
                )
            from_phone = str(msg.get("from") or "")
            text = str((msg.get("text") or {}).get("body") or "").strip()
            org_id = cfg.organization_id
        elif "text" in payload or "message" in payload:
            settings = get_settings()
            configured_secret = settings.proxy_secret
            if not configured_secret and settings.environment != "production":
                configured_secret = "service-ia-development-only-proxy-secret"
            if (
                not configured_secret
                or not internal_secret
                or not hmac.compare_digest(internal_secret, configured_secret)
            ):
                raise ApplicationError(
                    "invalid_internal_webhook_secret",
                    "Authentification du webhook interne invalide",
                    401,
                )
            text = str(payload.get("text") or payload.get("message") or "").strip()
            from_phone = str(payload.get("from") or "")
            message_id = str(payload.get("message_id") or uuid4())
            org_identifier = payload.get("organization_id")
            org_obj = None
            if org_identifier and org_identifier not in ("default", "koryxa_default", "org"):
                org_obj = await s.scalar(
                    select(Organization).where(
                        (Organization.id == org_identifier)
                        | (Organization.tenant_id == org_identifier)
                        | (Organization.slug == org_identifier)
                    )
                )
            if not org_obj:
                raise ApplicationError("whatsapp_tenant_not_found", "Organisation introuvable", 404)
            org_id = org_obj.id
        else:
            raise ApplicationError("invalid_whatsapp_payload", "Payload WhatsApp invalide", 400)

        # Déduplication
        if await s.scalar(
            select(WhatsAppWebhookEvent).where(WhatsAppWebhookEvent.message_id == message_id)
        ):
            return {"status": "duplicate"}

        s.add(WhatsAppWebhookEvent(organization_id=org_id, message_id=message_id))
        if not text:
            await s.commit()
            return {"status": "empty_content"}

        if cfg is None:
            cfg = await self.configs.get(s, org_id)

        clean_from_phone = normalize_e164(from_phone)
        sender_lid = payload.get("sender_lid") or payload.get("lid")
        if not sender_lid and "@lid" in from_phone:
            sender_lid = from_phone

        # -------------------------------------------------------------
        # CONTRÔLE STRICT DES EXPÉDITEURS AUTORISÉS (Chantier 1 - Zero Trust)
        # -------------------------------------------------------------
        is_authorized = await self.is_sender_authorized(
            s, org_id, clean_from_phone, cfg, sender_lid=sender_lid
        )
        if not is_authorized:
            await s.commit()
            neutral_reply = (
                cfg.whatsapp_unauthorized_reply
                or "Bonjour. Ce numéro n'est pas autorisé à enregistrer des opérations sur KORYXA. Contactez l'administrateur de votre entreprise."
            )
            return {
                "status": "unauthorized_sender",
                "from_phone": clean_from_phone,
                "sender_lid": sender_lid,
                "organization_id": org_id,
                "reply_message": neutral_reply,
            }

        # -------------------------------------------------------------
        # TRAITEMENT DES OPÉRATIONS POUR LES EXPÉDITEURS AUTORISÉS
        # -------------------------------------------------------------
        parsed = self.voice_service.parse_transcript(VoiceParseRequest(transcript=text))
        created = None
        reply_text = ""

        if parsed.sale:
            created = await self.voice_service.confirm_record(
                s,
                org_id,
                f"whatsapp:{clean_from_phone}",
                VoiceConfirmRequest(
                    intent=parsed.intent,
                    payload=parsed.sale.model_dump(),
                    source=RecordSource.INTEGRATION,
                ),
            )
            ref = created.get("reference") or (parsed.sale.reference if parsed.sale else "Enregistrée")
            amount = parsed.sale.total_amount if parsed.sale else ""
            currency = parsed.sale.currency if parsed.sale else "XOF"
            client_name = (parsed.sale.client_name if parsed.sale and parsed.sale.client_name else "Comptoir")
            reply_text = (
                f"✅ *Vente enregistrée avec succès !*\n\n"
                f"• Réf : {ref}\n"
                f"• Montant : {amount} {currency}\n"
                f"• Client : {client_name}\n"
                f"• Source : WhatsApp Gateway"
            )
        elif parsed.expense:
            created = await self.voice_service.confirm_record(
                s,
                org_id,
                f"whatsapp:{clean_from_phone}",
                VoiceConfirmRequest(
                    intent=parsed.intent,
                    payload=parsed.expense.model_dump(),
                ),
            )
            ref = created.get("reference") or (parsed.expense.reference if parsed.expense else "Enregistrée")
            amount = parsed.expense.amount if parsed.expense else ""
            currency = parsed.expense.currency if parsed.expense else "XOF"
            category = parsed.expense.category if parsed.expense else "Charges d'exploitation"
            desc = parsed.expense.beneficiary if parsed.expense else "Dépense"
            reply_text = (
                f"📤 *Dépense enregistrée avec succès !*\n\n"
                f"• Réf : {ref}\n"
                f"• Montant : {amount} {currency}\n"
                f"• Catégorie : {category}\n"
                f"• Détail : {desc}\n"
                f"• Rubrique : Frais d'exploitation"
            )
        else:
            # Traitement d'une question conversationnelle (solde, tarifs, activité)
            reply_text = await self._handle_conversational_query(s, org_id, text)

        await s.commit()

        # Envoi de la réponse automatique sur WhatsApp si activé et configuré
        if cfg and cfg.whatsapp_phone_number_id:
            access_token = self.configs.decrypt(cfg.whatsapp_access_token_encrypted)
            if cfg.whatsapp_auto_reply and access_token:
                api_ver = cfg.whatsapp_api_version or "v21.0"
                await self.send_reply(cfg.whatsapp_phone_number_id, access_token, from_phone, reply_text, api_version=api_ver)

        return {
            "status": "processed",
            "from_phone": clean_from_phone,
            "organization_id": org_id,
            "parsed_intent": parsed.intent,
            "record": created,
            "reply_message": reply_text,
        }

