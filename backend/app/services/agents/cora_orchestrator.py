# ruff: noqa: E501
from __future__ import annotations

from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
from app.services.agents.domain_expertise import get_domain_expertise
from app.services.agents.finance_agent import FinanceAgent
from app.services.agents.operations_sop_agent import OperationsSOPAgent
from app.services.agents.radar_sentinel_agent import RadarSentinelAgent
from app.services.agents.sales_recovery_agent import SalesRecoveryAgent
from app.services.registers import RegisterService


class CoraOrchestrator:
    """Directrice des Opérations & Chef d'Orchestre des Agents Spécialisés."""

    def __init__(self) -> None:
        self.finance_agent = FinanceAgent()
        self.sales_agent = SalesRecoveryAgent()
        self.radar_agent = RadarSentinelAgent()
        self.ops_agent = OperationsSOPAgent()
        self.registers_svc = RegisterService()

    async def route_and_execute(
        self, s: AsyncSession, org_id: str, user_id: str, request: AIChatRequest
    ) -> AIChatResponse:
        org = await s.get(Organization, org_id)
        org_name = org.name if org else "votre entreprise"
        responsible = org.responsible_name if org and org.responsible_name else "Dirigeant"
        sector_category = org.business_category if org else "retail"
        domain = get_domain_expertise(sector_category)
        is_education = "scol" in domain.get("sector_label", "").lower() or "ecole" in domain.get("sector_label", "").lower() or "éduc" in domain.get("sector_label", "").lower()

        # Get summary context
        summary = await self.registers_svc.get_summary(s, org_id)
        currency = summary.get("primary_currency", "XOF")

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

        context = {
            "total_sales_count": summary.get("total_sales_count", 0),
            "total_sales_amount": summary.get("total_sales_amount", 0),
            "total_sales_paid": summary.get("total_paid_amount", 0),
            "total_sales_unpaid": summary.get("total_unpaid_amount", 0),
            "total_expenses_paid": summary.get("total_expenses_paid", 0),
            "total_expenses_unpaid": summary.get("total_expenses_unpaid", 0),
            "net_cash_position": summary.get("net_cash_position", 0),
            "total_stock_value": summary.get("total_stock_value", 0),
            "low_stock_count": summary.get("low_stock_count", 0),
            "procedures_count": summary.get("procedures_count", 0),
            "unpaid_sales": unpaid_sales_rows,
            "open_alerts_count": summary.get("low_stock_count", 0),
            "critical_alerts": [],
        }

        last_user_msg = ""
        for m in reversed(request.messages):
            if m.role == "user":
                last_user_msg = m.content.strip()
                break

        msg_lower = last_user_msg.lower()

        # 1. Warm Executive Greeting (NO DATA DUMP on simple greetings)
        if msg_lower in ["bonjour", "salut", "bonsoir", "coucou", "hello", "hi", "bonjour cora", "salut cora"]:
            greeting_body = (
                f"Bonjour {responsible} ! C'est un plaisir de vous accompagner au pilotage de **{org_name}** ({domain.get('sector_label', '')}).\n\n"
                f"Je suis à vos côtés avec nos experts dédiés :\n"
                f"• 📊 {domain.get('role_finance')}\n"
                f"• 🤝 {domain.get('role_sales')}\n"
                f"• 🛡️ {domain.get('role_radar')}\n\n"
                f"De quoi souhaitez-vous parler aujourd'hui ? Je peux analyser votre trésorerie, faire le point sur vos créances ou enregistrer une transaction."
            )
            return AIChatResponse(
                reply=greeting_body,
                provider_used="Cora Intelligence (KORYXA Core)",
                model_used="koryxa-cora-orchestrator",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary=f"Accueil personnalisé selon le secteur {domain.get('sector_label')}...",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(
                        title="Situation de trésorerie",
                        action_type="send_chat",
                        payload={"prompt": "Quelle est ma trésorerie réelle et mon solde de caisse ?"}
                    ),
                    SuggestedAction(
                        title="Plan de recouvrement" if not is_education else "Écolages impayés",
                        action_type="send_chat",
                        payload={"prompt": "Quels sont les impayés et créances à relancer en priorité ?"}
                    ),
                    SuggestedAction(
                        title="Enregistrer un encaissement" if not is_education else "Encaisser un écolage",
                        action_type="navigate",
                        payload={"path": "/espace/ventes"}
                    ),
                ],
            )

        # 2. Route to Sales & Recovery Agent
        sales_terms = [
            "vente", "vendre", "vendu", "client", "relance", "créance", "creance", "impayé", "facture",
            "écolage", "ecolage", "scolarité", "scolarite", "tranche", "inscription", "élève", "eleve", "parent",
        ]
        if any(w in msg_lower for w in sales_terms):
            res = await self.sales_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency, domain=domain)
            return AIChatResponse(
                reply=res["reply"],
                provider_used="Knowlia Commercial Hub",
                model_used="koryxa-sales-recovery-agent",
                agent_name=res["agent_name"],
                agent_badge=res["agent_badge"],
                thinking_summary=res.get("thinking_summary"),
                action_executed=res.get("action_executed"),
                suggested_actions=[SuggestedAction(**a) for a in res.get("suggested_actions", [])],
            )

        # 3. Route to Finance & Cashflow Agent
        finance_terms = [
            "argent", "trésorerie", "tresorerie", "caisse", "solde", "dépense", "depense", "achat", "marge",
            "bfr", "financier", "vacation", "salaire", "charges", "fournisseur",
        ]
        if any(w in msg_lower for w in finance_terms):
            res = await self.finance_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency, domain=domain)
            return AIChatResponse(
                reply=res["reply"],
                provider_used="Knowlia Financial Intelligence",
                model_used="koryxa-finance-agent",
                agent_name=res["agent_name"],
                agent_badge=res["agent_badge"],
                thinking_summary=res.get("thinking_summary"),
                action_executed=res.get("action_executed"),
                suggested_actions=[SuggestedAction(**a) for a in res.get("suggested_actions", [])],
            )

        # 4. Route to Radar Sentinel Agent
        if any(w in msg_lower for w in ["radar", "alerte", "problème", "anomalie", "risque", "audit", "qualité", "stock"]):
            res = await self.radar_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency, domain=domain)
            return AIChatResponse(
                reply=res["reply"],
                provider_used="Knowlia Sentinel Intelligence",
                model_used="koryxa-radar-sentinel-agent",
                agent_name=res["agent_name"],
                agent_badge=res["agent_badge"],
                thinking_summary=res.get("thinking_summary"),
                action_executed=res.get("action_executed"),
                suggested_actions=[SuggestedAction(**a) for a in res.get("suggested_actions", [])],
            )

        # 5. Route to Operations & SOP Agent
        if any(w in msg_lower for w in ["procédure", "procedure", "process", "méthode", "règle", "organisation", "sop"]):
            res = await self.ops_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency, domain=domain)
            return AIChatResponse(
                reply=res["reply"],
                provider_used="Knowlia Operations Intelligence",
                model_used="koryxa-operations-sop-agent",
                agent_name=res["agent_name"],
                agent_badge=res["agent_badge"],
                thinking_summary=res.get("thinking_summary"),
                action_executed=res.get("action_executed"),
                suggested_actions=[SuggestedAction(**a) for a in res.get("suggested_actions", [])],
            )

        # Default Executive Diagnostic
        res = await self.finance_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency, domain=domain)
        return AIChatResponse(
            reply=res["reply"],
            provider_used="Cora Intelligence (KORYXA Core)",
            model_used="koryxa-cora-orchestrator",
            agent_name="Cora · Directrice des Opérations",
            agent_badge="🧑‍💼 Coach Exécutif",
            thinking_summary=res.get("thinking_summary"),
            action_executed=res.get("action_executed"),
            suggested_actions=[SuggestedAction(**a) for a in res.get("suggested_actions", [])],
        )

