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

        if open_alerts_count == 0 and low_stock_count == 0:
            return {
                "reply": (
                    f"🛡️ Le Radar KORYXA est au vert pour {org_name} !

"
                    f"Toutes vos opérations sont conformes : aucun écart de caisse, aucune rupture de stock critique, "
                    f"et toutes vos procédures disposent d'un responsable assigné."
                ),
                "agent_name": self.name,
                "agent_badge": self.badge,
                "thinking_summary": "Audit complet des 4 dimensions de qualité : complétude, fraîcheur, cohérence, traçabilité...",
                "action_executed": None,
                "suggested_actions": [
                    {"title": "Lancer un nouveau Scan Radar", "action_type": "run_radar", "payload": {}},
                ],
            }

        alerts_list = "
".join(
            [f"• 🔴 {a.get('title')} : {a.get('explanation')}" for a in critical_alerts[:4]]
        )

        stock_warning = f"
• ⚠️ {low_stock_count} produit(s) en stock critique sous le seuil d'alerte." if low_stock_count > 0 else ""

        reply = (
            f"🚨 Diagnostic Sentinelle Radar ({open_alerts_count} point(s) d'attention) :

"
            f"{alerts_list}{stock_warning}

"
            f"💡 Recommandation de l'Auditeur :
"
            f"Transformez ces alertes en actions correctives Kanban pour les assigner aux membres de votre équipe."
        )

        return {
            "reply": reply,
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": f"Identification et classification des {open_alerts_count} anomalies de conformité...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Voir le Radar & Qualité", "action_type": "navigate", "payload": {"path": "/espace/radar"}},
                {"title": "Gérer les Actions Kanban", "action_type": "navigate", "payload": {"path": "/espace/actions"}},
            ],
        }
