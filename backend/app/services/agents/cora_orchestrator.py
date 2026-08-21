# ruff: noqa: E501
from __future__ import annotations

from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
from app.services.agents.base import BaseSpecializedAgent
from app.services.agents.domain_expertise import get_domain_expertise
from app.services.agents.finance_agent import FinanceAgent
from app.services.agents.operations_sop_agent import OperationsSOPAgent
from app.services.agents.radar_sentinel_agent import RadarSentinelAgent
from app.services.agents.sales_recovery_agent import SalesRecoveryAgent
from app.services.registers import RegisterService


class CoraOrchestrator(BaseSpecializedAgent):
    """Directrice des Opérations & Chef d'Orchestre IA Sémantique de KORYXA."""

    def __init__(self) -> None:
        super().__init__(
            name="Cora · Directrice des Opérations",
            badge="🧑‍💼 Coach Exécutif",
            role_title="Directrice des Opérations & Stratégie",
            system_prompt=(
                "Tu es Cora, la Directrice des Opérations et Copilote IA de KORYXA. "
                "Tu as une vision à 360 degrés sur toute l'entreprise (Trésorerie, Ventes, Écolages, Dépenses, Stocks, Procédures et Radar Qualité). "
                "Tu comprends le langage naturel, le contexte de la conversation, les pronoms, les questions courtes de suivi ('et mon chiffre d'affaires ?', 'et les impayés ?', 'qui doit quoi ?', 'combien j'ai en caisse ?'), les homonymes et le jargon métier de chaque secteur. "
                "Tu réponds avec intelligence, précision, bienveillance et rigueur entrepreneuriale. "
                "Règle absolue : Ne jamais utiliser de markdown brut avec des doubles astérisques (pas de **)."
            ),
        )
        self.finance_agent = FinanceAgent()
        self.sales_agent = SalesRecoveryAgent()
        self.radar_agent = RadarSentinelAgent()
        self.ops_agent = OperationsSOPAgent()
        self.registers_svc = RegisterService()

    async def process(
        self,
        s: AsyncSession,
        org: str,
        user: str,
        user_message: str,
        context: dict[str, Any],
        org_name: str,
        currency: str,
        domain: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        # Implementation of abstract method required by BaseSpecializedAgent
        return {
            "reply": "Cora opérationnelle.",
            "agent_name": self.name,
            "agent_badge": self.badge,
        }

    async def route_and_execute(
        self, s: AsyncSession, org_id: str, user_id: str, request: AIChatRequest
    ) -> AIChatResponse:
        org = await s.get(Organization, org_id)
        org_name = org.name if org else "votre organisation"
        responsible = org.responsible_name if org and org.responsible_name else "Dirigeant"
        sector_category = org.business_category if org else "retail"
        domain = get_domain_expertise(sector_category)
        sector_label = domain.get("sector_label", "Entreprise")

        # 1. Fetch Real-time Accounting & Operational Snapshot
        summary = await self.registers_svc.get_summary(s, org_id)
        currency = summary.get("primary_currency", "XOF")

        total_sales_amount = float(summary.get("total_sales_amount", 0))
        total_sales_paid = float(summary.get("total_paid_amount", 0))
        total_sales_unpaid = float(summary.get("total_unpaid_amount", 0))
        total_expenses_paid = float(summary.get("total_expenses_paid", 0))
        net_cash = total_sales_paid - total_expenses_paid
        low_stock_count = int(summary.get("low_stock_count", 0))
        procedures_count = int(summary.get("procedures_count", 0))
        total_sales_count = int(summary.get("total_sales_count", 0))

        recouvrement_rate = (
            round((total_sales_paid / total_sales_amount) * 100)
            if total_sales_amount > 0
            else 100
        )

        unpaid_sales_rows = [
            {
                "ref": sale.reference,
                "client": sale.client_name or "Client",
                "amount": float(sale.total_amount) - float(sale.paid_amount),
                "date": str(sale.sale_date),
            }
            for sale in summary.get("recent_sales", [])
            if (sale.total_amount - sale.paid_amount) > 0
        ]

        # Extract last user message and format conversation history
        last_user_msg = ""
        history_lines: list[str] = []
        for m in request.messages:
            role_label = "Utilisateur" if m.role == "user" else "Cora"
            history_lines.append(f"{role_label}: {m.content.strip()}")
            if m.role == "user":
                last_user_msg = m.content.strip()

        history_str = "\n".join(history_lines[-8:])  # Last 8 turns for deep multi-turn memory
        msg_lower = last_user_msg.lower()

        # 2. Check for Direct Action Intents (e.g. "Enregistre une vente", "Enregistre une dépense")
        if any(w in msg_lower for w in ["enregistre une vente", "ajoute une vente", "nouvelle vente", "enregistrer vente", "enregistre l'écolage", "enregistre ecolage"]):
            sales_action = await self.sales_agent._try_record_sale(s, org_id, user_id, last_user_msg, currency)
            if sales_action:
                return AIChatResponse(
                    reply=sales_action["reply"],
                    provider_used="Knowlia Commercial Engine",
                    model_used="koryxa-sales-recovery-agent",
                    agent_name=sales_action["agent_name"],
                    agent_badge=sales_action["agent_badge"],
                    thinking_summary=sales_action.get("thinking_summary"),
                    action_executed=sales_action.get("action_executed"),
                    suggested_actions=[SuggestedAction(**a) for a in sales_action.get("suggested_actions", [])],
                )

        if any(w in msg_lower for w in ["enregistre une dépense", "enregistre la dépense", "ajoute une dépense", "enregistrer dépense", "nouvelle dépense", "payé une dépense", "décaissement"]):
            expense_action = await self.finance_agent._try_record_expense(s, org_id, user_id, last_user_msg, currency)
            if expense_action:
                return AIChatResponse(
                    reply=expense_action["reply"],
                    provider_used="Knowlia Financial Engine",
                    model_used="koryxa-finance-agent",
                    agent_name=expense_action["agent_name"],
                    agent_badge=expense_action["agent_badge"],
                    thinking_summary=expense_action.get("thinking_summary"),
                    action_executed=expense_action.get("action_executed"),
                    suggested_actions=[SuggestedAction(**a) for a in expense_action.get("suggested_actions", [])],
                )

        # 3. Build Deep Semantic Prompt for Knowlia LLM
        unpaid_summary = ", ".join([f"{u['client']} ({u['amount']:,.0f} {currency})" for u in unpaid_sales_rows[:5]]) or "Aucun impayé en cours"

        semantic_prompt = (
            f"Tu es Cora, la Directrice des Opérations de l'organisation : {org_name} ({sector_label}).\n"
            f"Interlocuteur : {responsible}\n"
            f"Devise principale : {currency}\n\n"
            f"Règles et vocabulaire métier sectoriels :\n"
            f"{domain.get('kpi_rules', '')}\n\n"
            f"Registre comptable et opérationnel en temps réel (Données certifiées) :\n"
            f"• Solde Réel en Caisse Disponible : {net_cash:,.0f} {currency}\n"
            f"• Chiffre d'Affaires Total Facturé : {total_sales_amount:,.0f} {currency} ({total_sales_count} opérations)\n"
            f"• Chiffre d'Affaires Encaissé en Caisse : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"• Créances / Impayés à Recouvrer : {total_sales_unpaid:,.0f} {currency} [Détail : {unpaid_summary}]\n"
            f"• Dépenses & Charges Payées : {total_expenses_paid:,.0f} {currency}\n"
            f"• Alertes Stock / Articles critiques : {low_stock_count}\n"
            f"• Procédures opérationnelles actives : {procedures_count}\n\n"
            f"Historique de la conversation récente :\n"
            f"{history_str}\n\n"
            f"Consigne d'intelligence :\n"
            f"Comprends le sens exact du dernier message de l'utilisateur ({last_user_msg}). S'il pose une question sur son chiffre d'affaires, réponds précisément sur le chiffre d'affaires. S'il pose une question sur sa trésorerie, réponds sur la trésorerie. S'il dit bonjour, accueille-le chaleureusement. S'il s'agit d'une relance ou d'un suivi, donne les détails pertinents. "
            f"Sois claire, percutante, pédagogue et oriente toujours vers la rentabilité et la bonne gestion. "
            f"Règle de format : Aucun markdown brut avec des doubles astérisques (**)."
        )

        # 4. Invoke LLM via Knowlia
        llm_reply = await self.call_knowlia_llm(s, org_id, user_id, semantic_prompt)

        if llm_reply:
            return AIChatResponse(
                reply=llm_reply,
                provider_used="Knowlia Intelligence Core",
                model_used="koryxa-cora-orchestrator",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Raisonnement contextuel multi-tour pour {org_name}...",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(title="Situation de trésorerie", action_type="send_chat", payload={"prompt": "Quelle est ma trésorerie réelle et mon solde de caisse ?"}),
                    SuggestedAction(title="Chiffre d'affaires", action_type="send_chat", payload={"prompt": "Quel est mon chiffre d'affaires global ?"}),
                    SuggestedAction(title="Créances à relancer", action_type="send_chat", payload={"prompt": "Quels sont les impayés prioritaires ?"}),
                ],
            )

        # 5. Fallback if LLM engine is offline
        if msg_lower in ["bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "bonjour cora", "salut cora"]:
            reply = (
                f"Bonjour {responsible} ! C'est un plaisir de vous retrouver au pilotage de {org_name} ({sector_label}).\n\n"
                f"Je suis à vos côtés avec nos experts dédiés (Analyste Financier, Responsable Commercial et Auditeur Sentinelle).\n\n"
                f"De quoi souhaitez-vous parler aujourd'hui ? Je peux analyser votre trésorerie, vos ventes, vos créances ou enregistrer une opération."
            )
        elif any(w in msg_lower for w in ["chiffre d'affaire", "chiffre d'affaires", "ca", "recette", "revenu", "combien on a vendu", "combien j'ai vendu"]):
            reply = (
                f"📈 Point sur le Chiffre d'Affaires de {org_name} :\n\n"
                f"• 💰 Chiffre d'Affaires Total Facturé : {total_sales_amount:,.0f} {currency}\n"
                f"• 📥 CA Réellement Encaissé en Caisse : {total_sales_paid:,.0f} {currency} ({recouvrement_rate}% du total)\n"
                f"• ⏳ CA en Attente d'Encaissement (Créances) : {total_sales_unpaid:,.0f} {currency}\n"
                f"• 🧾 Volume d'Opérations : {total_sales_count} transaction(s) enregistrée(s)\n\n"
                f"💡 Recommandation :\n"
                f"Votre chiffre d'affaires actif s'élève à {total_sales_amount:,.0f} {currency}. Pour consolider votre trésorerie, récupérez en priorité les {total_sales_unpaid:,.0f} {currency} de créances."
            ).replace(",", " ")
        elif any(w in msg_lower for w in ["argent", "trésorerie", "tresorerie", "caisse", "solde", "dépense", "depense"]):
            reply = (
                f"📊 Diagnostic Financier & Trésorerie pour {org_name} ({sector_label}) :\n\n"
                f"• 🏦 Solde Réel Disponible en Caisse : {net_cash:,.0f} {currency}\n"
                f"• 📥 Total Encaissé : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
                f"• 📤 Total Charges Payées : {total_expenses_paid:,.0f} {currency}\n"
                f"• ⏳ Créances en Attente : {total_sales_unpaid:,.0f} {currency}\n\n"
                f"💡 Recommandation :\n"
                f"Votre solde net est de {net_cash:,.0f} {currency}. " + (
                    "Votre trésorerie est saine." if net_cash >= 0 else "Attention : vos dépenses dépassent vos encaissements actuels."
                )
            ).replace(",", " ")
        else:
            reply = (
                f"📊 Synthèse Globale pour {org_name} ({sector_label}) :\n\n"
                f"• 🏦 Solde de Caisse : {net_cash:,.0f} {currency}\n"
                f"• 💰 Chiffre d'Affaires : {total_sales_amount:,.0f} {currency} ({total_sales_paid:,.0f} {currency} encaissés)\n"
                f"• ⏳ Créances : {total_sales_unpaid:,.0f} {currency}\n"
                f"• 📦 Alertes Stocks / Radar : {low_stock_count} point(s) d'attention\n\n"
                f"Posez-moi toute question spécifique sur vos finances, vos clients ou vos opérations !"
            ).replace(",", " ")

        return AIChatResponse(
            reply=reply,
            provider_used="Cora Intelligence (KORYXA Core)",
            model_used="koryxa-cora-orchestrator",
            agent_name="Cora · Directrice des Opérations",
            agent_badge="🧑‍💼 Coach Exécutif",
            thinking_summary=f"Analyse contextuelle pour {org_name}...",
            action_executed=None,
            suggested_actions=[
                SuggestedAction(title="Situation de trésorerie", action_type="send_chat", payload={"prompt": "Quelle est ma trésorerie réelle ?"}),
                SuggestedAction(title="Chiffre d'affaires", action_type="send_chat", payload={"prompt": "Quel est mon chiffre d'affaires global ?"}),
                SuggestedAction(title="Créances à relancer", action_type="send_chat", payload={"prompt": "Quels sont les impayés prioritaires ?"}),
            ],
        )
