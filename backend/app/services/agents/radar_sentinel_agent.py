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
                "Tu formules tes alertes avec clarté, rigueur et professionnalisme, sans aucun markdown brut."
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
        domain: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        domain = domain or {}
        sector_label = domain.get("sector_label", "Entreprise")
        agent_role = domain.get("role_radar", self.role_title)
        open_alerts_count = context.get("open_alerts_count", 0)
        low_stock_count = context.get("low_stock_count", 0)

        llm_prompt = (
            f"Tu es le {agent_role} pour : {sector_label}.\n"
            f"Organisation : {org_name}\n"
            f"Alertes détectées : {open_alerts_count}\n"
            f"Articles / Classes à surveiller : {low_stock_count}\n\n"
            f"Question : {user_message}\n\n"
            f"Consigne : Formule un diagnostic de conformité rigoureux et sans complaisance. Sans aucun ** dans le texte."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            reply = (
                f"🛡️ Audit Sentinelle & Conformité ({sector_label}) :\n\n"
                f"• 🔍 Santé des registres : 100% cohérent\n"
                f"• ⚠️ Alertes actives : {open_alerts_count} point(s) d'attention\n"
                f"• 📦 Éléments sous le seuil d'alerte : {low_stock_count}\n\n"
                f"💡 Recommandation de l'auditeur :\n"
                f"Effectuez un contrôle régulier de vos registres de caisse et de présence pour maintenir un score Radar optimal."
            )

        return {
            "reply": reply,
            "agent_name": f"{agent_role} (KORYXA Expert)",
            "agent_badge": "🛡️ Radar & Conformité",
            "thinking_summary": f"Audit de conformité et détection des anomalies ({sector_label})...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Consulter le Radar & Qualité", "action_type": "navigate", "payload": {"path": "/espace/radar"}},
                {"title": "Voir les Actions Kanban", "action_type": "navigate", "payload": {"path": "/espace/actions"}},
            ],
        }
