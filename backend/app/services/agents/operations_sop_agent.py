from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agents.base import BaseSpecializedAgent


class OperationsSOPAgent(BaseSpecializedAgent):
    """Agent Méthodes, Procédures Opérationnelles et Standards Métier (SOP)."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Méthodes & Procédures",
            badge="📋 Standards & Procédures",
            role_title="Directeur des Méthodes & Processus",
            system_prompt=(
                "Tu es l'Expert en Procédures Opérationnelles Standardisées (SOP) et Organisation Métier de KORYXA. "
                "Tu rédiges des protocoles clairs, étape par étape, faciles à exécuter pour les équipes sur le terrain."
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
        agent_role = domain.get("role_ops", self.role_title)
        procedures_count = context.get("procedures_count", 0)

        llm_prompt = (
            f"Tu es le {agent_role} spécialisé pour : {sector_label}.\n"
            f"Organisation : {org_name}\n"
            f"Nombre de procédures existantes : {procedures_count}\n\n"
            f"Demande de procédure : {user_message}\n\n"
            f"Consigne : Rédige une procédure opérationnelle étape par étape (Objectif, Responsable, Étapes chronologiques, Résultat attendu). Sans aucun ** dans le texte."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            reply = (
                f"📋 Standard Opérationnel ({sector_label}) :\n\n"
                f"1. Objectif : Standardiser et fiabiliser les opérations de {org_name}.\n"
                f"2. Déclencheur : Toute nouvelle opération de caisse, inscription ou validation.\n"
                f"3. Étapes clés :\n"
                f"   • Étape 1 : Vérification de l'identité et saisie immédiate dans KORYXA.\n"
                f"   • Étape 2 : Émission du reçu ou justificatif au payeur.\n"
                f"   • Étape 3 : Rapprochement journalier du tiroir-caisse physique.\n"
                f"4. Résultat attendu : 100% de traçabilité et 0 écart comptable."
            )

        return {
            "reply": reply,
            "agent_name": f"{agent_role} (KORYXA Expert)",
            "agent_badge": "📋 Méthodes & Procédures",
            "thinking_summary": f"Structuration de la procédure opérationnelle ({sector_label})...",
            "action_executed": None,
            "suggested_actions": [
                {
                    "title": "Consulter les Procédures",
                    "action_type": "navigate",
                    "payload": {"path": "/espace/procedures"},
                },
                {
                    "title": "Créer une Procédure",
                    "action_type": "navigate",
                    "payload": {"path": "/espace/procedures"},
                },
            ],
        }
