from __future__ import annotations

import secrets
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.integrations import (
    OrganizationIntegrationConfig,
    TelegramAuthorizedUser,
)
from app.models.organization import Organization
from app.models.radar import AlertStatus, RadarAlert
from app.models.registers import Expense, PaymentStatus, RecordSource, Sale
from app.schemas.telegram import (
    TelegramAuthorizedUserRead,
    TelegramAuthorizedUserUpdate,
    TelegramConfigRead,
)
from app.schemas.voice import VoiceConfirmRequest
from app.services.integration_config import IntegrationConfigService
from app.services.voice import VoiceService

TELEGRAM_API_BASE = "https://api.telegram.org"
OFFICIAL_BOT_USERNAME = "cauri_koryxa_bot"


class TelegramService:
    def __init__(self, voice_service: VoiceService | None = None) -> None:
        self.voice_service = voice_service or VoiceService()
        self.configs = IntegrationConfigService()

    def _get_official_bot_token(self) -> str:
        settings = get_settings()
        # Fallback to configured env var or default
        return getattr(settings, "telegram_bot_token", None) or "8884618965:AAGPcrd5MQQWr-iibxs0DvByIvH0vVXjpRA"

    async def send_message(
        self,
        bot_token: str,
        chat_id: int | str,
        text: str,
        reply_markup: dict[str, Any] | None = None,
    ) -> bool:
        url = f"{TELEGRAM_API_BASE}/bot{bot_token}/sendMessage"
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                return resp.status_code == 200
        except Exception:
            return False

    async def set_webhook(self, bot_token: str, webhook_url: str) -> dict[str, Any]:
        url = f"{TELEGRAM_API_BASE}/bot{bot_token}/setWebhook"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json={"url": webhook_url})
                return resp.json()
        except Exception as e:
            return {"ok": False, "description": str(e)}

    async def get_me(self, bot_token: str) -> dict[str, Any]:
        url = f"{TELEGRAM_API_BASE}/bot{bot_token}/getMe"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url)
                return resp.json()
        except Exception as e:
            return {"ok": False, "description": str(e)}

    async def get_or_create_link_code(
        self, s: AsyncSession, org_id: str
    ) -> str:
        cfg = await self.configs.get(s, org_id)
        if not cfg.telegram_link_code:
            cfg.telegram_link_code = f"link_org_{secrets.token_urlsafe(12)}"
            await s.flush()
        return cfg.telegram_link_code

    async def get_config(
        self, s: AsyncSession, org_id: str
    ) -> TelegramConfigRead:
        cfg = await self.configs.get(s, org_id)
        link_code = await self.get_or_create_link_code(s, org_id)
        custom_token = self.configs.decrypt(cfg.telegram_bot_token_encrypted)
        
        deep_link_url = f"https://t.me/{OFFICIAL_BOT_USERNAME}?start={link_code}"

        return TelegramConfigRead(
            is_active=cfg.telegram_active,
            link_code=link_code,
            deep_link_url=deep_link_url,
            bot_username=cfg.telegram_bot_username or OFFICIAL_BOT_USERNAME,
            custom_bot_active=bool(custom_token),
            custom_bot_username=cfg.telegram_bot_username if custom_token else None,
            has_custom_bot_token=bool(custom_token),
        )

    async def regenerate_link_code(
        self, s: AsyncSession, org_id: str
    ) -> str:
        cfg = await self.configs.get(s, org_id)
        cfg.telegram_link_code = f"link_org_{secrets.token_urlsafe(12)}"
        await s.flush()
        return cfg.telegram_link_code

    async def list_authorized_users(
        self, s: AsyncSession, org_id: str
    ) -> list[TelegramAuthorizedUserRead]:
        result = await s.scalars(
            select(TelegramAuthorizedUser)
            .where(TelegramAuthorizedUser.organization_id == org_id)
            .order_by(TelegramAuthorizedUser.created_at.desc())
        )
        return [
            TelegramAuthorizedUserRead(
                id=u.id,
                organization_id=u.organization_id,
                telegram_user_id=u.telegram_user_id,
                telegram_username=u.telegram_username,
                first_name=u.first_name,
                last_name=u.last_name,
                label=u.label,
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in result.all()
        ]

    async def update_authorized_user(
        self, s: AsyncSession, org_id: str, user_id: str, data: TelegramAuthorizedUserUpdate
    ) -> TelegramAuthorizedUserRead | None:
        user = await s.scalar(
            select(TelegramAuthorizedUser).where(
                TelegramAuthorizedUser.id == user_id,
                TelegramAuthorizedUser.organization_id == org_id,
            )
        )
        if not user:
            return None
        if data.label is not None:
            user.label = data.label
        user.is_active = data.is_active
        await s.flush()
        return TelegramAuthorizedUserRead(
            id=user.id,
            organization_id=user.organization_id,
            telegram_user_id=user.telegram_user_id,
            telegram_username=user.telegram_username,
            first_name=user.first_name,
            last_name=user.last_name,
            label=user.label,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    async def delete_authorized_user(
        self, s: AsyncSession, org_id: str, user_id: str
    ) -> bool:
        user = await s.scalar(
            select(TelegramAuthorizedUser).where(
                TelegramAuthorizedUser.id == user_id,
                TelegramAuthorizedUser.organization_id == org_id,
            )
        )
        if not user:
            return False
        await s.delete(user)
        await s.flush()
        return True

    async def set_custom_bot(
        self, s: AsyncSession, org_id: str, bot_token: str, app_url: str
    ) -> dict[str, Any]:
        me_data = await self.get_me(bot_token)
        if not me_data.get("ok"):
            return {"ok": False, "message": "Token de bot Telegram invalide ou rejeté par Telegram."}
        
        bot_user = me_data.get("result", {})
        bot_username = bot_user.get("username", "")

        webhook_url = f"{app_url.rstrip('/')}/api/v1/telegram/webhook?org_id={org_id}"
        wh_result = await self.set_webhook(bot_token, webhook_url)
        if not wh_result.get("ok"):
            return {"ok": False, "message": f"Erreur lors de la configuration du webhook : {wh_result.get('description')}"}

        cfg = await self.configs.get(s, org_id)
        cfg.telegram_bot_token_encrypted = self.configs.encrypt(bot_token)
        cfg.telegram_bot_username = bot_username
        cfg.telegram_active = True
        await s.flush()

        return {
            "ok": True,
            "message": f"Bot @{bot_username} configuré et activé avec succès !",
            "bot_username": bot_username,
        }

    # =========================================================================
    # INBOUND UPDATE HANDLER (WEBHOOK)
    # =========================================================================

    async def handle_inbound_update(
        self, s: AsyncSession, payload: dict[str, Any], explicit_org_id: str | None = None
    ) -> bool:
        message = payload.get("message") or payload.get("edited_message")
        callback_query = payload.get("callback_query")

        # 1. Handle Callback Queries (Inline button clicks)
        if callback_query:
            return await self._handle_callback_query(s, callback_query, explicit_org_id)

        if not message:
            return True

        chat = message.get("chat", {})
        chat_id = chat.get("id")
        from_user = message.get("from", {})
        telegram_user_id = str(from_user.get("id", ""))
        text = str(message.get("text", "")).strip()

        if not chat_id or not telegram_user_id:
            return True

        # Bot token to use for replies
        bot_token = self._get_official_bot_token()

        # 2. Check for explicit org_id or user linking
        target_org: Organization | None = None
        user_record: TelegramAuthorizedUser | None = None

        if explicit_org_id:
            target_org = await s.scalar(select(Organization).where(Organization.id == explicit_org_id))
            cfg = await self.configs.get(s, explicit_org_id)
            custom_token = self.configs.decrypt(cfg.telegram_bot_token_encrypted)
            if custom_token:
                bot_token = custom_token

        # 3. Check for Linking code anywhere in message: /start link_org_xxxx or raw link_org_xxxx
        import re
        link_match = re.search(r"link_org_[a-zA-Z0-9_\-]+", text)
        if link_match:
            link_code = link_match.group(0)
            cfg = await s.scalar(
                select(OrganizationIntegrationConfig).where(
                    OrganizationIntegrationConfig.telegram_link_code == link_code
                )
            )
            if not cfg:
                await self.send_message(
                    bot_token,
                    chat_id,
                    "❌ <b>Code de liaison invalide ou expiré.</b>\n\nVeuillez générer un nouveau lien depuis votre cockpit sur : https://cauri.koryxa.fr/espace/telegram",
                )
                return True

            target_org = await s.scalar(select(Organization).where(Organization.id == cfg.organization_id))
            if not target_org:
                return True

            # Create or update authorized user
            existing_user = await s.scalar(
                select(TelegramAuthorizedUser).where(
                    TelegramAuthorizedUser.organization_id == target_org.id,
                    TelegramAuthorizedUser.telegram_user_id == telegram_user_id,
                )
            )
            if not existing_user:
                existing_user = TelegramAuthorizedUser(
                    organization_id=target_org.id,
                    telegram_user_id=telegram_user_id,
                    telegram_username=from_user.get("username"),
                    first_name=from_user.get("first_name"),
                    last_name=from_user.get("last_name"),
                    label="Mobile / Terrain",
                    is_active=True,
                )
                s.add(existing_user)
            else:
                existing_user.is_active = True
                existing_user.telegram_username = from_user.get("username")
            await s.commit()

            # Send Welcome & Interactive Menu
            await self._send_welcome_menu(
                bot_token, chat_id, target_org.name, from_user.get("first_name") or "Gestionnaire"
            )
            return True

        # 4. If not a linking command, find linked organization for this user
        if not target_org:
            user_record = await s.scalar(
                select(TelegramAuthorizedUser).where(
                    TelegramAuthorizedUser.telegram_user_id == telegram_user_id,
                    TelegramAuthorizedUser.is_active.is_(True),
                )
            )
            if user_record:
                target_org = await s.scalar(select(Organization).where(Organization.id == user_record.organization_id))

        # If user is still not linked:
        if not target_org:
            await self.send_message(
                bot_token,
                chat_id,
                "👋 <b>Bienvenue sur CAURI by KORYXA !</b>\n\n"
                "Ce compte Telegram n'est pas encore relié à une entreprise.\n\n"
                "🔗 <b>Pour connecter votre boutique en 1 clic :</b>\n"
                "1. Connectez-vous sur <a href='https://cauri.koryxa.fr/espace/telegram'>cauri.koryxa.fr/espace/telegram</a>\n"
                "2. Cliquez sur <b>« Lier mon compte Telegram »</b>\n"
                "3. Vos données seront instantanément synchronisées et 100% sécurisées !",
            )
            return True

        # 5. Process Commands for linked user
        lower_text = text.lower()
        if lower_text in ("/start", "/menu", "menu", "start", "/cockpit"):
            await self._send_welcome_menu(
                bot_token, chat_id, target_org.name, from_user.get("first_name") or "Gestionnaire"
            )
            return True

        if lower_text in ("/solde", "/bilan", "bilan", "solde", "/chiffres"):
            await self._send_daily_summary(s, bot_token, chat_id, target_org.id, target_org.name)
            return True

        if lower_text in ("/radar", "radar", "/alertes", "alertes"):
            await self._send_radar_alerts(s, bot_token, chat_id, target_org.id)
            return True

        if lower_text in ("/aide", "/help", "aide", "help", "/guide"):
            await self._send_help_guide(bot_token, chat_id)
            return True

        if lower_text in ("/vente", "vente", "/depense", "depense"):
            await self.send_message(
                bot_token,
                chat_id,
                "✍️ <b>Comment enregistrer une opération ?</b>\n\n"
                "Écrivez simplement votre vente ou votre dépense en langage naturel dans ce chat :\n\n"
                "🛍️ <i>Exemples de ventes :</i>\n"
                "• <code>Vente 3x Cartons Savon 15000 payé espèces au client Koffi</code>\n"
                "• <code>Vendu 2 sacs de riz 25 000 F en Wave</code>\n\n"
                "💸 <i>Exemples de dépenses :</i>\n"
                "• <code>Dépense 5000 essence moto livraison</code>\n"
                "• <code>Achat fournitures bureau 12500 F</code>",
            )
            return True

        # 6. Natural Language Processing for Sales & Expenses
        await self._process_natural_language_message(
            s, bot_token, chat_id, target_org.id, target_org.name, text
        )
        return True

    # =========================================================================
    # HELPERS & RESPONSES
    # =========================================================================

    async def _send_welcome_menu(
        self, bot_token: str, chat_id: int | str, org_name: str, first_name: str
    ) -> None:
        text = (
            f"👋 <b>Bonjour {first_name} !</b>\n\n"
            f"🏢 Organisation active : <b>{org_name}</b>\n\n"
            "Que souhaitez-vous faire ?"
        )
        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "🚀 Ouvrir le Cockpit CAURI",
                        "web_app": {"url": "https://cauri.koryxa.fr/espace"},
                    }
                ],
                [
                    {"text": "📊 Bilan du Jour & CA", "callback_data": "action_solde"},
                    {"text": "📡 Radar & Alertes", "callback_data": "action_radar"},
                ],
                [
                    {"text": "💡 Guide & Exemples", "callback_data": "action_aide"},
                ],
            ]
        }
        await self.send_message(bot_token, chat_id, text, reply_markup)

    async def _send_daily_summary(
        self, s: AsyncSession, bot_token: str, chat_id: int | str, org_id: str, org_name: str
    ) -> None:
        today = date.today()
        # Sales today
        sales_today = await s.execute(
            select(
                func.count(Sale.id).label("count"),
                func.coalesce(func.sum(Sale.total_amount), Decimal("0")).label("total_ca"),
                func.coalesce(
                    func.sum(
                        case(
                            (Sale.payment_status == "paid", func.coalesce(func.nullif(Sale.paid_amount, Decimal("0")), Sale.total_amount)),
                            (Sale.payment_status == "partial", func.coalesce(Sale.paid_amount, Decimal("0"))),
                            else_=Decimal("0"),
                        )
                    ),
                    Decimal("0"),
                ).label("total_paid"),
            ).where(
                Sale.organization_id == org_id,
                Sale.date == today,
            )
        )
        row = sales_today.one()
        count = row.count or 0
        total_ca = float(row.total_ca or 0)
        total_paid = float(row.total_paid or 0)
        pending_creances = max(0, total_ca - total_paid)

        # Expenses today
        expenses_today = await s.scalar(
            select(func.coalesce(func.sum(Expense.amount), Decimal("0"))).where(
                Expense.organization_id == org_id,
                Expense.date == today,
            )
        )
        total_expenses = float(expenses_today or 0)
        net_cash = total_paid - total_expenses

        msg = (
            f"📊 <b>Bilan Opérationnel du Jour</b> ({today.strftime('%d/%m/%Y')})\n"
            f"🏢 <b>{org_name}</b>\n\n"
            f"📈 <b>Chiffre d'Affaires :</b> <code>{total_ca:,.0f} XOF</code> ({count} ventes)\n"
            f"💵 <b>Total Encaissé :</b> <code>{total_paid:,.0f} XOF</code>\n"
            f"💸 <b>Dépenses :</b> <code>{total_expenses:,.0f} XOF</code>\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"💰 <b>Trésorerie Nette :</b> <code>{net_cash:,.0f} XOF</code>\n"
            f"⏳ <b>Créances du jour :</b> <code>{pending_creances:,.0f} XOF</code>"
        )
        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "🚀 Voir les détails sur le Cockpit",
                        "web_app": {"url": "https://cauri.koryxa.fr/espace"},
                    }
                ]
            ]
        }
        await self.send_message(bot_token, chat_id, msg, reply_markup)

    async def _send_radar_alerts(
        self, s: AsyncSession, bot_token: str, chat_id: int | str, org_id: str
    ) -> None:
        alerts = await s.scalars(
            select(RadarAlert)
            .where(
                RadarAlert.organization_id == org_id,
                RadarAlert.status == AlertStatus.OPEN,
            )
            .order_by(RadarAlert.severity.desc())
            .limit(5)
        )
        alerts_list = alerts.all()
        if not alerts_list:
            await self.send_message(
                bot_token,
                chat_id,
                "📡 <b>Radar Opérationnel KORYXA</b>\n\n✅ <b>Tout est sous contrôle !</b> Aucune anomalie critique ou impayé majeur détecté.",
            )
            return

        lines = ["📡 <b>Alertes Radar Actives :</b>\n"]
        for a in alerts_list:
            icon = "🔴" if a.severity == "critical" else "🟠" if a.severity == "warning" else "🔵"
            lines.append(f"{icon} <b>{a.title}</b>\n{a.description or ''}\n")

        lines.append("<i>Consultez votre radar complet pour traiter ces points.</i>")
        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "📡 Ouvrir le Radar CAURI",
                        "web_app": {"url": "https://cauri.koryxa.fr/espace/radar"},
                    }
                ]
            ]
        }
        await self.send_message(bot_token, chat_id, "\n".join(lines), reply_markup)

    async def _send_help_guide(self, bot_token: str, chat_id: int | str) -> None:
        msg = (
            "💡 <b>Guide d'Utilisation CAURI Telegram</b>\n\n"
            "<b>1. Commandes rapides :</b>\n"
            "• <code>/cockpit</code> : Lance l'application complète dans Telegram\n"
            "• <code>/solde</code> : Résumé de votre CA et encaissements du jour\n"
            "• <code>/radar</code> : Vos alertes de stock et créances en attente\n\n"
            "<b>2. Saisie en direct par message :</b>\n"
            "Envoyez simplement un message texte comme :\n"
            "👉 <i>« Vente 5 cartons de savon 25000 payé espèces »</i>\n"
            "👉 <i>« Dépense 3000 carburant livraison »</i>\n\n"
            "L'IA enregistre automatiquement l'opération dans votre compte !"
        )
        await self.send_message(bot_token, chat_id, msg)

    async def _handle_callback_query(
        self, s: AsyncSession, callback_query: dict[str, Any], explicit_org_id: str | None
    ) -> bool:
        data = callback_query.get("data")
        message = callback_query.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        from_user = callback_query.get("from", {})
        telegram_user_id = str(from_user.get("id", ""))
        bot_token = self._get_official_bot_token()

        if not chat_id or not data:
            return True

        # Find org
        target_org: Organization | None = None
        if explicit_org_id:
            target_org = await s.scalar(select(Organization).where(Organization.id == explicit_org_id))
        else:
            user_record = await s.scalar(
                select(TelegramAuthorizedUser).where(
                    TelegramAuthorizedUser.telegram_user_id == telegram_user_id,
                    TelegramAuthorizedUser.is_active.is_(True),
                )
            )
            if user_record:
                target_org = await s.scalar(select(Organization).where(Organization.id == user_record.organization_id))

        if not target_org:
            return True

        if data == "action_solde":
            await self._send_daily_summary(s, bot_token, chat_id, target_org.id, target_org.name)
        elif data == "action_radar":
            await self._send_radar_alerts(s, bot_token, chat_id, target_org.id)
        elif data == "action_aide":
            await self._send_help_guide(bot_token, chat_id)

        return True

    async def _process_natural_language_message(
        self,
        s: AsyncSession,
        bot_token: str,
        chat_id: int | str,
        org_id: str,
        org_name: str,
        text: str,
    ) -> None:
        parsed = self.voice_service.parse_transcript(text)
        
        # If no recognized intent
        if not parsed.intent or parsed.intent.value == "unknown":
            await self.send_message(
                bot_token,
                chat_id,
                "🤖 <i>Je n'ai pas bien compris votre opération.</i>\n\n"
                "Pour enregistrer une vente, précisez l'article et le montant, par exemple :\n"
                "• <code>Vente 2 cartons savon 15000 payé espèces</code>\n"
                "• <code>Dépense 5000 essence moto</code>\n\n"
                "Tapez <code>/menu</code> pour afficher les raccourcis.",
            )
            return

        # Confirm and persist the record
        payload: dict[str, Any] | list[dict[str, Any]]
        if parsed.intent.value == "sale":
            if parsed.sales:
                payload = [s.model_dump() for s in parsed.sales]
            elif parsed.sale:
                payload = parsed.sale.model_dump()
            else:
                payload = {}
        elif parsed.intent.value == "expense":
            if parsed.expenses:
                payload = [e.model_dump() for e in parsed.expenses]
            elif parsed.expense:
                payload = parsed.expense.model_dump()
            else:
                payload = {}
        elif parsed.intent.value == "offer" and parsed.offer:
            payload = parsed.offer.model_dump()
        elif parsed.intent.value == "procedure" and parsed.procedure:
            payload = parsed.procedure.model_dump()
        else:
            payload = {}

        req = VoiceConfirmRequest(
            intent=parsed.intent,
            payload=payload,
            source=RecordSource.VOICE,
        )

        try:
            confirmed = await self.voice_service.confirm_record(
                s=s,
                org_id=org_id,
                user_id=f"telegram:{chat_id}",
                request=req,
            )
            await s.commit()

            if parsed.intent.value == "sale" and (parsed.sales or parsed.sale):
                sale = parsed.sales[0] if parsed.sales else parsed.sale
                status_badge = "✅ Payé" if sale.payment_status == PaymentStatus.PAID else "⏳ À crédit / Partiel"
                msg = (
                    f"🎉 <b>Vente Enregistrée !</b>\n\n"
                    f"📦 <b>Offre :</b> {sale.item_label or 'Vente standard'}\n"
                    f"🔢 <b>Quantité :</b> {sale.quantity or 1}\n"
                    f"💰 <b>Montant Total :</b> <code>{sale.total_amount:,.0f} {sale.currency or 'XOF'}</code>\n"
                    f"💳 <b>Statut :</b> {status_badge}\n"
                    f"👤 <b>Client :</b> {sale.client_name or 'Comptant'}\n\n"
                    f"🏢 Synchronisé avec <b>{org_name}</b>"
                )
            elif parsed.intent.value == "expense" and (parsed.expenses or parsed.expense):
                exp = parsed.expenses[0] if parsed.expenses else parsed.expense
                msg = (
                    f"💸 <b>Dépense Enregistrée !</b>\n\n"
                    f"🏷️ <b>Bénéficiaire / Description :</b> {exp.beneficiary or 'Dépense diverse'}\n"
                    f"💰 <b>Montant :</b> <code>{exp.amount:,.0f} {exp.currency or 'XOF'}</code>\n"
                    f"📁 <b>Catégorie :</b> {exp.category or 'Générale'}\n\n"
                    f"🏢 Synchronisé avec <b>{org_name}</b>"
                )
            else:
                msg = f"✅ <b>Opération ({parsed.intent.value}) enregistrée avec succès sur {org_name} !</b>"

            reply_markup = {
                "inline_keyboard": [
                    [
                        {
                            "text": "🚀 Voir sur le Cockpit",
                            "web_app": {"url": "https://cauri.koryxa.fr/espace"},
                        }
                    ]
                ]
            }
            await self.send_message(bot_token, chat_id, msg, reply_markup)

        except Exception as e:
            await s.rollback()
            await self.send_message(
                bot_token,
                chat_id,
                f"⚠️ Une erreur est survenue lors de l'enregistrement : {str(e)}",
            )
