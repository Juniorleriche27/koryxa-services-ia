from __future__ import annotations

import re
from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.registers import ExpenseCreate, PaymentStatus
from app.services.agents.base import BaseSpecializedAgent
from app.services.registers import RegisterService
from app.services.financial_metrics import collect_financial_registers


class FinanceAgent(BaseSpecializedAgent):
    """Agent Spécialisé en Analyse Financière, Marges et Trésorerie."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Analyste Financier & Trésorerie",
            badge="📊 Analyste Financier",
            role_title="Directeur Financier & Trésorerie",
            system_prompt=(
                "Tu es l'Analyste Financier et Trésorier expert de KORYXA. "
                "Tu analyses les registres de ventes et dépenses, tout en distinguant flux déclarés, trésorerie et rentabilité. "
                "Sans éléments de bilan, charges classifiées et solde initial, tu indiques Non calculable. "
                "Tu rédiges des réponses ultra-claires, professionnelles et directes, sans aucun markdown brut (pas de doubles astérisques **)."
            ),
        )
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
        msg_lower = user_message.lower()
        domain = domain or {}
        sector_label = domain.get("sector_label", "Commerce & Entreprise")
        agent_role = domain.get("role_finance", self.role_title)
        is_education = (
            "scol" in sector_label.lower()
            or "ecole" in sector_label.lower()
            or "éduc" in sector_label.lower()
        )

        # Action: Detect "Enregistre une dépense / vacation / charge..."
        expense_triggers = [
            "enregistre une dépense",
            "enregistre la dépense",
            "ajoute une dépense",
            "enregistrer dépense",
            "nouvelle dépense",
            "payé une dépense",
            "dépense de",
            "règlement vacation",
            "reglement vacation",
            "vacation de",
            "salaire de",
            "achat fourniture",
            "décaissement de",
            "decaissement de",
        ]
        if any(w in msg_lower for w in expense_triggers):
            return {
                "reply": "Confirmez cette dépense depuis son registre. Aucune opération n'a été créée.",
                "agent_name": self.name,
                "agent_badge": self.badge,
                "action_executed": None,
                "suggested_actions": [{"title": "Ouvrir le registre", "action_type": "navigate", "payload": {"path": "/espace/depenses"}}],
            }

        # Reuse the same calculation as the dashboard and Cora Orchestrator.
        snap = await collect_financial_registers(s, org)
        sm = snap.summary
        unit = sm["primary_currency"]
        status = sm["financial_data_status"]
        if status != "registers_only":
            reply = "Données financières insuffisantes ou non comparables. " + " ".join(sm["financial_warnings"])
        else:
            sales = sm["total_sales_amount"]
            paid = sm["total_paid_amount"]
            due = sm["total_unpaid_amount"]
            expenses_paid = sm["total_expenses_paid"]
            expenses_pending = sm["total_expenses_unpaid"]
            register_delta = sm["cash_movement_net"]
            recovery = sm["recovery_rate"]
            facts = (
                f"Ventes validées (historique complet) : {sales:,.2f} {unit}. "
                f"Paiements déclarés : {paid:,.2f} {unit}. "
                f"Créances en attente : {due:,.2f} {unit}, dont échues : {sm['receivables_overdue']:,.2f} {unit}. "
                f"Dépenses réglées : {expenses_paid:,.2f} {unit}; restant à régler : {expenses_pending:,.2f} {unit}. "
                f"Écart des registres : {register_delta:,.2f} {unit}; taux de recouvrement : {recovery if recovery is not None else 'Non calculable'}%. "
                "Solde de caisse, bénéfice, marge brute, seuil, autonomie et FRNG : non calculables avec ces seules écritures."
            )
            llm_prompt = (
                f"Tu es le {agent_role} pour {org_name} ({sector_label}).\n"
                f"Constats observés : {facts}\n"
                f"Demande : {user_message}\n"
                "Explique avec prudence. Ne présente pas l'écart des registres comme solde bancaire. "
                "N'affirme aucune rentabilité ni trésorerie saine sans données complètes. "
                "Distingue créances échues et non échues. Sans markdown brut."
            )
            llm_reply = await self.call_knowlia_llm(s, org, user, llm_prompt)
            reply = llm_reply or (f"📊 Lecture des registres pour {org_name} :\n\n{facts}")

        return {
            "reply": reply,
            "agent_name": f"{agent_role} (KORYXA Expert)",
            "agent_badge": "🎓 Intendance & Trésorerie" if is_education else "📊 Finance & Trésorerie",
            "thinking_summary": f"Lecture des registres et limites financières ({sector_label})",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Voir les Dépenses", "action_type": "navigate", "payload": {"path": "/espace/depenses"}},
                {"title": "Consulter les Ventes", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
            ],
        }

    async def _try_record_expense(self, *args, **kwargs):
        """Deprecated and permanently fail-closed: interactive chat cannot write."""
        raise PermissionError("Écritures métier interdites depuis l'agent conversationnel")
