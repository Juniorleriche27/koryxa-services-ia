# mypy: disable-error-code="no-untyped-def,no-untyped-call,attr-defined,var-annotated,dict-item"
from __future__ import annotations

import json
import urllib.parse
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.radar import AlertStatus, RadarAlert
from app.models.registers import Expense, PaymentStatus, Procedure, RecordStatus, Sale
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AIConfigBase,
    AIConfigRead,
    AIConfigUpdate,
    AIProviderType,
    PaymentReminderChannel,
    PaymentReminderRequest,
    PaymentReminderResponse,
    PaymentReminderTone,
    ProcedureGenerationRequest,
    ProcedureGenerationResponse,
    ProcedureStepDraft,
    SuggestedAction,
)


# In-memory tenant AI configuration store with fallback to settings
_TENANT_AI_CONFIGS: dict[str, dict[str, Any]] = {}


class AIEngineService:
    def get_config(self, org: str) -> AIConfigRead:
        cfg = _TENANT_AI_CONFIGS.get(org, {})
        provider = cfg.get("provider", AIProviderType.NATIVE)
        return AIConfigRead(
            provider=provider,
            model_name=cfg.get("model_name", "koryxa-smart-v1"),
            api_base_url=cfg.get("api_base_url"),
            temperature=cfg.get("temperature", 0.3),
            custom_system_prompt=cfg.get("custom_system_prompt"),
            has_api_key=bool(cfg.get("api_key")),
        )

    def update_config(self, org: str, data: AIConfigUpdate) -> AIConfigRead:
        current = _TENANT_AI_CONFIGS.get(org, {})
        new_cfg = {
            "provider": data.provider,
            "model_name": data.model_name,
            "api_base_url": data.api_base_url,
            "temperature": data.temperature,
            "custom_system_prompt": data.custom_system_prompt,
        }
        if data.api_key is not None:
            new_cfg["api_key"] = data.api_key.strip()
        else:
            new_cfg["api_key"] = current.get("api_key")

        _TENANT_AI_CONFIGS[org] = new_cfg
        return self.get_config(org)

    # ------------------ COPILOT CHAT ------------------
    async def chat(
        self, s: AsyncSession, org: str, user: str, request: AIChatRequest
    ) -> AIChatResponse:
        cfg = _TENANT_AI_CONFIGS.get(org, {})
        provider = cfg.get("provider", AIProviderType.NATIVE)
        api_key = cfg.get("api_key")
        model = cfg.get("model_name", "koryxa-smart-v1")
        base_url = cfg.get("api_base_url")

        # 1. Compile Organization Context
        context_data = await self._build_context(s, org, request)

        # 2. Try Provider Dispatch
        if provider == AIProviderType.GEMINI and api_key:
            try:
                reply = await self._call_gemini(api_key, model, request.messages, context_data)
                return AIChatResponse(
                    reply=reply,
                    provider_used="Google Gemini",
                    model_used=model,
                    suggested_actions=self._extract_actions(context_data),
                )
            except Exception:
                pass  # Fallback to native

        elif provider == AIProviderType.OPENAI and api_key:
            try:
                reply = await self._call_openai(
                    api_key, model, base_url or "https://api.openai.com/v1", request.messages, context_data
                )
                return AIChatResponse(
                    reply=reply,
                    provider_used="OpenAI",
                    model_used=model,
                    suggested_actions=self._extract_actions(context_data),
                )
            except Exception:
                pass  # Fallback to native

        elif provider == AIProviderType.COHERE and api_key:
            try:
                reply = await self._call_cohere(api_key, model, request.messages, context_data)
                return AIChatResponse(
                    reply=reply,
                    provider_used="Cohere",
                    model_used=model,
                    suggested_actions=self._extract_actions(context_data),
                )
            except Exception:
                pass  # Fallback to native

        elif provider == AIProviderType.GATEWAY and base_url:
            try:
                reply = await self._call_openai(
                    api_key or "no-key", model, base_url, request.messages, context_data
                )
                return AIChatResponse(
                    reply=reply,
                    provider_used="Custom AI Gateway / Serveur Privé",
                    model_used=model,
                    suggested_actions=self._extract_actions(context_data),
                )
            except Exception:
                pass  # Fallback to native

        # 3. Native Autonomous Reasoning Engine (Zero-dependency & Ultra-Smart)
        reply = self._native_chat_reasoning(request.messages, context_data)
        return AIChatResponse(
            reply=reply,
            provider_used="Moteur Autonome Koryxa (Intégré)",
            model_used="koryxa-smart-v1",
            suggested_actions=self._extract_actions(context_data),
        )

    # ------------------ PAYMENT REMINDER GENERATION ------------------
    async def generate_payment_reminder(
        self, s: AsyncSession, org: str, user: str, req: PaymentReminderRequest
    ) -> PaymentReminderResponse:
        cfg = _TENANT_AI_CONFIGS.get(org, {})
        provider = cfg.get("provider", AIProviderType.NATIVE)
        api_key = cfg.get("api_key")

        # Native generator with specialized French & African business recovery phrasing
        currency = req.currency or "XOF"
        amount_fmt = f"{req.amount:,.0f} {currency}".replace(",", " ")
        days_str = f"depuis {req.overdue_days} jours" if req.overdue_days > 0 else "arrivée à échéance"
        payment_info = req.payment_methods_info or "Wave / Orange Money / MTN MoMo ou Virement bancaire"

        if req.tone == PaymentReminderTone.COURTEOUS:
            subject = f"Rappel amical : Règlement de la facture {req.reference}"
            if req.channel == PaymentReminderChannel.WHATSAPP:
                body = (
                    f"Bonjour {req.client_name}, nous espérons que vous allez bien.\n\n"
                    f"Sauf erreur ou omission de notre part, nous constatons que la facture *{req.reference}* "
                    f"d'un montant de *{amount_fmt}* ({days_str}) est actuellement en attente de règlement.\n\n"
                    f"💳 Règlement possible via : {payment_info}.\n\n"
                    f"Merci de nous transmettre votre preuve de paiement dès que possible. Nous restons à votre entière disposition !"
                )
            else:
                body = (
                    f"Madame, Monsieur {req.client_name},\n\n"
                    f"Nous vous remercions pour votre confiance continue. Sauf erreur de notre part, "
                    f"le règlement de la facture réf. {req.reference} d'un montant de {amount_fmt} "
                    f"est arrivé à échéance ({days_str}).\n\n"
                    f"Nous vous saurions gré de bien vouloir procéder à sa régularisation par {payment_info}.\n\n"
                    f"Si votre virement a déjà été émis, nous vous prions de ne pas tenir compte de ce message.\n\n"
                    f"Cordialement,\nLa Direction Financière"
                )
        elif req.tone == PaymentReminderTone.FIRM:
            subject = f"Deuxième rappel : Échéance dépassée pour la facture {req.reference}"
            if req.channel == PaymentReminderChannel.WHATSAPP:
                body = (
                    f"Bonjour {req.client_name},\n\n"
                    f"Nous revenons vers vous concernant la facture *{req.reference}* d'un montant de *{amount_fmt}*, "
                    f"en retard de *{req.overdue_days} jours*.\n\n"
                    f"Afin d'éviter toute suspension de service ou pénalité, nous vous demandons de régulariser cette somme aujourd'hui même via : {payment_info}.\n\n"
                    f"Merci de nous confirmer le règlement dès validation."
                )
            else:
                body = (
                    f"Madame, Monsieur {req.client_name},\n\n"
                    f"Malgré notre précédente correspondance, nous n'avons pas constaté le règlement de la facture {req.reference} "
                    f"s'élevant à {amount_fmt}, dont l'échéance est dépassée de {req.overdue_days} jours.\n\n"
                    f"Nous vous prions de procéder à son règlement sous 48 heures par {payment_info}.\n\n"
                    f"Comptant sur votre diligence pour clore ce dossier dans les meilleurs délais.\n\n"
                    f"Service Recouvrement"
                )
        else:  # LEGAL / MISE EN DEMEURE
            subject = f"MISE EN DEMEURE AVANT CONTENTIEUX — Facture {req.reference}"
            body = (
                f"LETTRE DE MISE EN DEMEURE DE PAYER\n\n"
                f"À l'attention de : {req.client_name}\n"
                f"Objet : Facture impayée {req.reference} — Montant : {amount_fmt}\n"
                f"Délai de retard : {req.overdue_days} jours\n\n"
                f"Madame, Monsieur,\n\n"
                f"Par la présente, nous vous mettons formellement en demeure de régler la somme principale de {amount_fmt} "
                f"au titre de la prestation/vente {req.reference}.\n\n"
                f"À défaut de réception des fonds sous un délai impératif de 8 (huit) jours ouvrés par {payment_info}, "
                f"nous transmettrons ce dossier sans autre préavis à notre service juridique pour recouvrement forcé et application des intérêts légaux de retard.\n\n"
                f"Fait pour valoir ce que de droit."
            )

        whatsapp_url = None
        if req.channel == PaymentReminderChannel.WHATSAPP:
            encoded_text = urllib.parse.quote(body)
            whatsapp_url = f"https://api.whatsapp.com/send?text={encoded_text}"

        return PaymentReminderResponse(
            subject=subject,
            body=body,
            provider_used="Moteur Autonome Koryxa (Formules Juridiques & Commerciales)",
            formatted_whatsapp_url=whatsapp_url,
        )

    # ------------------ PROCEDURE GENERATION ------------------
    async def generate_procedure(
        self, s: AsyncSession, org: str, user: str, req: ProcedureGenerationRequest
    ) -> ProcedureGenerationResponse:
        title = req.title.strip()
        desc = req.description.strip()
        dept = req.department or "Opérations"

        # Heuristic procedural decomposition
        steps: list[ProcedureStepDraft] = []
        steps.append(
            ProcedureStepDraft(
                step_number=1,
                title="Préparation & Vérification des éléments initiaux",
                description=f"Rassembler les données, documents et pièces justificatives nécessaires pour '{title}'. Vérifier la conformité préalable.",
                role_responsible=f"Agent référent / {dept}",
                input_required="Demande initiale, fiches ou justificatifs clients",
                output_produced="Dossier validé et prêt au traitement",
            )
        )
        steps.append(
            ProcedureStepDraft(
                step_number=2,
                title="Exécution opérationnelle & Saisie",
                description=f"Appliquer le traitement opérationnel suivant les consignes de '{desc}'. Enregistrer toutes les informations dans Koryxa.",
                role_responsible="Opérateur / Responsable de traitement",
                input_required="Dossier validé",
                output_produced="Prestation ou enregistrement effectué",
            )
        )
        steps.append(
            ProcedureStepDraft(
                step_number=3,
                title="Contrôle qualité & Conformité",
                description="Contrôler les montants, la cohérence des dates, les signatures et l'absence de doublons ou d'anomalies.",
                role_responsible="Superviseur / Contrôleur qualité",
                input_required="Rapport d'exécution ou pièce saisie",
                output_produced="Visa de conformité validé",
            )
        )
        steps.append(
            ProcedureStepDraft(
                step_number=4,
                title="Clôture, Archivage & Notification client",
                description="Archiver la preuve numérique, notifier le client ou le responsable hiérarchique et clôturer l'enregistrement.",
                role_responsible="Responsable du département",
                input_required="Visa de conformité",
                output_produced="Dossier archivé et notifié",
            )
        )

        return ProcedureGenerationResponse(
            title=title,
            objective=f"Standardiser et sécuriser l'exécution de '{title}' au sein du pôle {dept}.",
            department=dept,
            prerequisites=[
                "Accès au système Koryxa avec les autorisations appropriées",
                "Formation aux règles de conformité et de contrôle qualité du département",
            ],
            steps=steps[: req.expected_steps_count],
            quality_checks=[
                "Vérification systématique des montants et pièces justificatives",
                "Validation hiérarchique avant transmission définitive",
            ],
            provider_used="Moteur Autonome Koryxa (Générateur SOP Standardisé)",
        )

    # ------------------ CONTEXT BUILDER ------------------
    async def _build_context(self, s: AsyncSession, org: str, request: AIChatRequest) -> dict[str, Any]:
        sales = list(
            (
                await s.scalars(
                    select(Sale)
                    .where(Sale.organization_id == org, Sale.is_archived.is_(False))
                    .order_by(Sale.sale_date.desc())
                    .limit(20)
                )
            ).all()
        )
        expenses = list(
            (
                await s.scalars(
                    select(Expense)
                    .where(Expense.organization_id == org, Expense.is_archived.is_(False))
                    .order_by(Expense.expense_date.desc())
                    .limit(20)
                )
            ).all()
        )
        alerts = list(
            (
                await s.scalars(
                    select(RadarAlert)
                    .where(
                        RadarAlert.organization_id == org,
                        RadarAlert.status == AlertStatus.OPEN,
                    )
                    .order_by(RadarAlert.priority.desc())
                    .limit(10)
                )
            ).all()
        )
        procedures = list(
            (
                await s.scalars(
                    select(Procedure)
                    .where(Procedure.organization_id == org, Procedure.is_archived.is_(False))
                    .limit(10)
                )
            ).all()
        )

        total_sales_paid = sum(
            (sa.total_amount for sa in sales if sa.payment_status in {PaymentStatus.PAID, "paid"}),
            Decimal("0.00"),
        )
        total_sales_unpaid = sum(
            (sa.total_amount for sa in sales if sa.payment_status not in {PaymentStatus.PAID, "paid"}),
            Decimal("0.00"),
        )
        total_exp_paid = sum(
            (ex.amount for ex in expenses if ex.payment_status in {PaymentStatus.PAID, "paid"}),
            Decimal("0.00"),
        )
        total_exp_unpaid = sum(
            (ex.amount for ex in expenses if ex.payment_status not in {PaymentStatus.PAID, "paid"}),
            Decimal("0.00"),
        )

        net_cash = total_sales_paid - total_exp_paid
        projected_cash = net_cash + total_sales_unpaid - total_exp_unpaid

        return {
            "total_sales_count": len(sales),
            "total_sales_paid": str(total_sales_paid),
            "total_sales_unpaid": str(total_sales_unpaid),
            "total_expenses_paid": str(total_exp_paid),
            "total_expenses_unpaid": str(total_exp_unpaid),
            "net_cash_position": str(net_cash),
            "projected_30d_cash": str(projected_cash),
            "open_alerts_count": len(alerts),
            "critical_alerts": [
                {"title": a.title, "explanation": a.explanation, "priority": str(a.priority.value if hasattr(a.priority, "value") else a.priority)}
                for a in alerts[:5]
            ],
            "unpaid_sales": [
                {"ref": sa.reference, "client": sa.client_name or "Client anonyme", "amount": str(sa.total_amount), "date": str(sa.sale_date)}
                for sa in sales if sa.payment_status != PaymentStatus.PAID
            ][:5],
            "procedures_count": len(procedures),
        }

    # ------------------ NATIVE REASONING ENGINE ------------------
    def _native_chat_reasoning(self, messages: list[Any], ctx: dict[str, Any]) -> str:
        last_msg = messages[-1].content.lower() if messages else ""

        if any(w in last_msg for w in ["trésorerie", "solde", "cash", "argent", "banque", "disponible"]):
            return (
                f"📊 **Analyse de votre Trésorerie en Temps Réel** :\n\n"
                f"• **Solde net actuel disponible** : **{ctx['net_cash_position']} XOF** (Encaissements effectifs : {ctx['total_sales_paid']} XOF − Décaissements réglés : {ctx['total_expenses_paid']} XOF)\n"
                f"• **Créances clients à recouvrer** : **{ctx['total_sales_unpaid']} XOF**\n"
                f"• **Dettes fournisseurs à régler** : **{ctx['total_expenses_unpaid']} XOF**\n"
                f"• **Trésorerie prévisionnelle à 30 jours** : **{ctx['projected_30d_cash']} XOF**\n\n"
                f"💡 **Conseil stratégique** : Relancez sans tarder les clients débiteurs ({len(ctx['unpaid_sales'])} créances en cours) pour consolider vos liquidités avant le règlement des prochaines échéances fournisseurs."
            )

        if any(w in last_msg for w in ["relance", "impayé", "créance", "débiteur", "qui me doit"]):
            if not ctx["unpaid_sales"]:
                return "✅ Excellente nouvelle : Vous n'avez aucune créance client impayée actuellement enregistrée dans vos registres !"
            
            unpaid_list = "\n".join(
                [f"• **{s['client']}** ({s['ref']}) : **{s['amount']} XOF** (Date : {s['date']})" for s in ctx["unpaid_sales"]]
            )
            return (
                f"⚠️ **Priorités de Recouvrement ({ctx['total_sales_unpaid']} XOF au total)** :\n\n"
                f"Voici les principales ventes en attente de paiement :\n{unpaid_list}\n\n"
                f"👉 Vous pouvez utiliser le **Générateur de Relances IA** pour envoyer un rappel WhatsApp ou Email en 1 clic directement depuis l'onglet Ventes."
            )

        if any(w in last_msg for w in ["radar", "alerte", "problème", "anomalie", "risque"]):
            if ctx["open_alerts_count"] == 0:
                return "🛡️ **Radar KORYXA est au vert** : Aucune anomalie, tarif expiré ou incohérence de procédure n'a été détectée."
            
            alerts_text = "\n".join([f"• 🔴 **{a['title']}** : {a['explanation']}" for a in ctx["critical_alerts"]])
            return (
                f"🚨 **Synthèse Sentinelle Radar ({ctx['open_alerts_count']} alerte(s) active(s))** :\n\n"
                f"{alerts_text}\n\n"
                f"👉 Rendez-vous dans la section **Radar** ou transformez ces alertes en **Actions correctives Kanban** pour les attribuer à votre équipe."
            )

        if any(w in last_msg for w in ["procédure", "sop", "process", "méthode", "règle"]):
            return (
                f"📋 **Mémoire Opérationnelle & Procédures** :\n\n"
                f"Votre entreprise dispose de **{ctx['procedures_count']} procédure(s)** formalisée(s).\n\n"
                f"Pour formaliser un nouveau processus métier (ex: clôture de caisse, accueil client, gestion des stocks), vous pouvez utiliser le **Générateur de Procédure IA** qui structurera automatiquement les étapes, rôles et contrôles de qualité."
            )

        # General Executive Briefing
        return (
            f"👋 **Bonjour ! Je suis le Copilote IA KORYXA de votre entreprise.**\n\n"
            f"Voici un aperçu synthétique de votre situation opérationnelle et financière :\n"
            f"• 💰 **Chiffre d'affaires encaissé** : **{ctx['total_sales_paid']} XOF** (Créances en attente : {ctx['total_sales_unpaid']} XOF)\n"
            f"• 📉 **Dépenses décaissées** : **{ctx['total_expenses_paid']} XOF** (Dettes fournisseurs : {ctx['total_expenses_unpaid']} XOF)\n"
            f"• 🛡️ **Alertes Radar actives** : **{ctx['open_alerts_count']}** point(s) d'attention\n"
            f"• 📋 **Procédures opérationnelles** : **{ctx['procedures_count']}** méthode(s) active(s)\n\n"
            f"Comment puis-je vous aider aujourd'hui ? Je peux analyser vos marges, rédiger une relance client ou vous aider à formaliser une procédure !"
        )

    def _extract_actions(self, ctx: dict[str, Any]) -> list[SuggestedAction]:
        actions = [
            SuggestedAction(title="Consulter les Ventes", action_type="navigate", payload={"path": "/espace/ventes"}),
            SuggestedAction(title="Voir la Trésorerie & Dépenses", action_type="navigate", payload={"path": "/espace/depenses"}),
            SuggestedAction(title="Scanner avec Radar", action_type="run_radar", payload={}),
        ]
        if ctx.get("unpaid_sales"):
            actions.insert(0, SuggestedAction(title="Relancer les créances impayées", action_type="send_reminder", payload={}))
        return actions

    # ------------------ EXTERNAL API ADAPTERS ------------------
    async def _call_gemini(self, api_key: str, model: str, messages: list[Any], ctx: dict[str, Any]) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        prompt = f"Tu es le copilote IA d'entreprise KORYXA. Voici le contexte financier réel : {json.dumps(ctx, ensure_ascii=False)}.\n\nDemande utilisateur: {messages[-1].content}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return str(data["candidates"][0]["content"]["parts"][0]["text"])

    async def _call_openai(
        self, api_key: str, model: str, base_url: str, messages: list[Any], ctx: dict[str, Any]
    ) -> str:
        url = f"{base_url.rstrip('/')}/chat/completions"
        system_msg = {
            "role": "system",
            "content": f"Tu es le copilote IA d'entreprise KORYXA. Contexte financier : {json.dumps(ctx, ensure_ascii=False)}.",
        }
        api_messages = [system_msg] + [{"role": m.role, "content": m.content} for m in messages]
        payload = {"model": model, "messages": api_messages, "temperature": 0.3}
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return str(data["choices"][0]["message"]["content"])

    async def _call_cohere(self, api_key: str, model: str, messages: list[Any], ctx: dict[str, Any]) -> str:
        url = "https://api.cohere.com/v2/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": f"Tu es KORYXA Copilot. Données réelles: {json.dumps(ctx, ensure_ascii=False)}"},
                {"role": "user", "content": messages[-1].content},
            ],
        }
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return str(data["message"]["content"][0]["text"])
