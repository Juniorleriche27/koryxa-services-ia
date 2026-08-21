from __future__ import annotations

from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agents.base import BaseSpecializedAgent


class RadarSentinelAgent(BaseSpecializedAgent):
    """Agent Sentinelle & Conformité Opérationnelle (Radar)."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Sentinelle & Conformité",
            badge="🛡️ Sentinelle Radar",
            role_title="Auditeur Interne & Conformité",
            system_prompt=(
                "Tu es l'Auditeur Qualité et Sentinelle Opérationnelle de KORYXA. "
                "Tu veilles sur la complétude des données, la fraîcheur des saisies, la cohérence comptable et la traçabilité des opérations. "
                "Tu détectes les risques de fraude, les écarts de caisse et les ruptures de stock. "
                "Tu formules tes alertes avec clarté, rigueur et professionnalisme, sans aucun markdown brut (pas de doubles astérisques **)."
            ),
        )

    async def process(
        self,
        s: AsyncSession,
        org: str,
        user: str,
        user_message: str,
        context: dict[str, Any],
        org_name: str,
        currency: str,
    ) -> dict[str, Any]:
        open_alerts_count = context.get("open_alerts_count", 0)
        critical_alerts = context.get("critical_alerts", [])
        low_stock_count = context.get("low_stock_count", 0)

        llm_prompt = (
            f"{self.system_prompt}\n\n"
            f"Entreprise : {org_name}\n"
            f"Nombre d'alertes qualité détectées : {open_alerts_count}\n"
            f"Produits en stock critique : {low_stock_count}\n"
            f"Alertes actives : {critical_alerts}\n\n"
            f"Question du dirigeant : {user_message}\n\n"
            f"Consigne : Propose un diagnostic de conformité précis et des actions correctives. Sans aucun ** dans le texte."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            if open_alerts_count == 0 and low_stock_count == 0:
                reply = (
                    f"🛡️ Le Radar KORYXA est au vert pour {org_name} !\n\n"
                    f"Toutes vos opérations sont conformes : aucun écart de caisse, aucune rupture de stock critique, "
                    f"et toutes vos procédures disposent d'un responsable assigné."
                )
            else:
                alerts_list = "\n".join(
                    [f"• 🔴 {a.get('title')} : {a.get('explanation')}" for a in critical_alerts[:4]]
                )
                stock_warn = f"\n• ⚠️ {low_stock_count} référence(s) sous le seuil critique de stock." if low_stock_count > 0 else ""

                reply = (
                    f"🚨 Rapport d'Audit Sentinelle Radar ({open_alerts_count} point(s) d'attention) :\n\n"
                    f"{alerts_list}{stock_warn}\n\n"
                    f"💡 Recommandation de l'Auditeur :\n"
                    f"Transformez ces constats en actions correctives Kanban pour les assigner aux membres de votre équipe."
                )

        return {
            "reply": reply,
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": "Audit multi-dimensionnel de la traçabilité, des stocks et de la cohérence de saisie...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Consulter le Radar & Qualité", "action_type": "navigate", "payload": {"path": "/espace/radar"}},
                {"title": "Voir les Actions Kanban", "action_type": "navigate", "payload": {"path": "/espace/actions"}},
            ],
        }
