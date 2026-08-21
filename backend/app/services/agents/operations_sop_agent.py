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
            system_prompt=(
                "Tu es le Consultant Méthodes et Organisation Opérationnelle de KORYXA. "
                "Tu es un expert en structuration des processus d'entreprise, rédaction de fiches de procédures standardisées (SOP), "
                "formation des équipes et sécurisation des protocoles de travail (clôture de caisse, inventaire, service client). "
                "Tu rédiges avec pédagogie, clarté et précision, sans aucun markdown brut (pas de doubles astérisques **)."
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
        procedures_count = context.get("procedures_count", 0)

        llm_prompt = (
            f"{self.system_prompt}\n\n"
            f"Entreprise : {org_name}\n"
            f"Nombre de procédures déjà formalisées : {procedures_count}\n"
            f"Demande du dirigeant : {user_message}\n\n"
            f"Consigne : Aide le dirigeant à structurer ou optimiser ses méthodes de travail. Sans aucun ** dans le texte."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            reply = (
                f"📋 Mémoire Opérationnelle & Méthodes pour {org_name} :\n\n"
                f"Votre entreprise dispose actuellement de {procedures_count} procédure(s) formalisée(s).\n\n"
                f"💡 Pourquoi formaliser vos méthodes ?\n"
                f"• Garantir la qualité du service même en l'absence du dirigeant.\n"
                f"• Faciliter la formation rapide des nouvelles recrues.\n"
                f"• Éviter les erreurs de caisse et de gestion des stocks.\n\n"
                f"👉 Vous pouvez utiliser le Générateur de Procédure IA pour créer en quelques secondes une fiche étape par étape."
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
