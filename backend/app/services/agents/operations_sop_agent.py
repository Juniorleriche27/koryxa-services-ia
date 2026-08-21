from __future__ import annotations

from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agents.base import BaseSpecializedAgent


class OperationsSOPAgent(BaseSpecializedAgent):
    """Agent Spécialisé en Organisation, Processus et Procédures (SOP)."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Procédures & Organisation",
            badge="📋 Organisation & SOP",
            role_title="Responsable Méthodes & Organisation",
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
        procedures_count = context.get("procedures_count", 0)

        reply = (
            f"📋 Mémoire Opérationnelle & Méthodes pour {org_name} :

"
            f"Votre entreprise dispose actuellement de {procedures_count} procédure(s) formalisée(s).

"
            f"💡 Pourquoi formaliser vos méthodes ?
"
            f"• Garantir la qualité du service même en l'absence du dirigeant.
"
            f"• Faciliter la formation rapide des nouvelles recrues.
"
            f"• Éviter les erreurs de caisse et de gestion des stocks.

"
            f"👉 Vous pouvez utiliser le Générateur de Procédure IA pour créer en quelques secondes une fiche étape par étape (ex: Clôture journalière de caisse, Gestion des retours marchandises, Accueil client)."
        )

        return {
            "reply": reply,
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": "Revue des processus formalisés et identification des manques organisationnels...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Consulter les Procédures", "action_type": "navigate", "payload": {"path": "/espace/procedures"}},
            ],
        }
