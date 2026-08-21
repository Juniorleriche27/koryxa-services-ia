from __future__ import annotations

import re
from decimal import Decimal
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.registers import ExpenseCreate, ExpenseDocumentType, PaymentStatus
from app.services.agents.base import BaseSpecializedAgent
from app.services.registers import RegisterService


class FinanceAgent(BaseSpecializedAgent):
    """Agent Spécialisé en Analyse Financière, Marges et Trésorerie."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Analyste Financier & Trésorerie",
            badge="📊 Analyste Financier",
            role_title="Directeur Financier & Trésorerie",
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
    ) -> dict[str, Any]:
        msg_lower = user_message.lower()

        # Action: Detect "Enregistre une dépense..."
        if any(w in msg_lower for w in ["enregistre une dépense", "ajoute une dépense", "enregistrer dépense", "nouvelle dépense", "payé une dépense", "dépense de"]):
            action_res = await self._try_record_expense(s, org, user, user_message, currency)
            if action_res:
                return action_res

        # Financial Diagnostic & Cashflow Analysis
        total_sales_paid = float(context.get("total_sales_paid", 0))
        total_expenses_paid = float(context.get("total_expenses_paid", 0))
        total_sales_unpaid = float(context.get("total_sales_unpaid", 0))
        net_cash = total_sales_paid - total_expenses_paid
        total_stock_value = float(context.get("total_stock_value", 0))

        # Financial Health Status
        if net_cash > 0:
            cash_health = f"Solde Net Positif (+{net_cash:,.0f} {currency})".replace(",", " ")
            health_tip = "Votre trésorerie est saine et vous permet de couvrir vos charges opérationnelles sereinement."
        elif net_cash == 0:
            cash_health = f"Solde à l'Équilibre (0 {currency})"
            health_tip = "Vos entrées couvrent tout juste vos sorties. Il est prioritaire d'accélérer les encaissements clients."
        else:
            cash_health = f"Déficit Temporaire ({net_cash:,.0f} {currency})".replace(",", " ")
            health_tip = "Attention : vos sorties de fonds dépassent vos encaissements actuels. Récupérez en priorité les créances clients."

        recouvrement_rate = (
            round((total_sales_paid / (total_sales_paid + total_sales_unpaid)) * 100)
            if (total_sales_paid + total_sales_unpaid) > 0
            else 100
        )

        reply = (
            f"📊 Diagnostic Financier & Trésorerie pour {org_name} :

"
            f"• 🏦 Solde Réel Disponible en Caisse : {net_cash:,.0f} {currency} ({cash_health})
"
            f"• 📥 Total Encaissé Réel : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)
"
            f"• 📤 Total Dépenses Payées : {total_expenses_paid:,.0f} {currency}
"
            f"• ⏳ Créances Clients en Attente : {total_sales_unpaid:,.0f} {currency}
"
            f"• 📦 Valeur Estimée du Stock : {total_stock_value:,.0f} {currency}

"
            f"💡 Recommandation Stratégique :
{health_tip}"
        ).replace(",", " ")

        return {
            "reply": reply,
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": "Analyse rigoureuse de la trésorerie nette, calcul du taux de recouvrement et évaluation du BFR...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Voir la Trésorerie & Dépenses", "action_type": "navigate", "payload": {"path": "/espace/depenses"}},
                {"title": "Relancer les créances clients", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
            ],
        }

    async def _try_record_expense(
        self, s: AsyncSession, org: str, user: str, msg: str, currency: str
    ) -> dict[str, Any] | None:
        # Regex to capture amount and beneficiary/category
        amount_match = re.search(r"(\d+(?:[\s.,]\d+)?)\s*(?:f|cfa|xof|eur|\$|francs?)?", msg, re.IGNORECASE)
        if not amount_match:
            return None

        raw_amt = amount_match.group(1).replace(" ", "").replace(",", ".")
        try:
            amt = Decimal(raw_amt)
        except Exception:
            return None

        # Detect category
        category = "Divers"
        for cat in ["Loyer", "Salaires", "Marchandises", "Énergie", "Transport", "Marketing", "Taxes"]:
            if cat.lower() in msg.lower():
                category = cat
                break

        # Detect beneficiary
        beneficiary = f"Dépense {category}"
        for marker in ["pour", "chez", "à", "au"]:
            if f" {marker} " in msg.lower():
                parts = msg.split(f" {marker} ", 1)[1].split(" payé")[0].split(" par")[0].strip()
                if len(parts) > 1:
                    beneficiary = parts[:80]
                break

        # Detect payment method
        method = "Espèces"
        for m in ["wave", "orange money", "mtn", "moov", "virement", "chèque", "carte"]:
            if m in msg.lower():
                method = m.capitalize()
                break

        expense = await self.registers_svc.create_expense(
            s,
            org,
            user,
            ExpenseCreate(
                category=category,
                beneficiary=beneficiary,
                amount=amt,
                paid_amount=amt,
                currency=currency,
                payment_method=method,
                payment_status=PaymentStatus.PAID,
                comment="Enregistré via Coach IA Cora",
            ),
        )

        return {
            "reply": (
                f"✅ Dépense enregistrée avec succès :

"
                f"• 📤 Montant décaissé : {amt:,.0f} {currency}
"
                f"• 🏷️ Catégorie : {category}
"
                f"• 🏢 Bénéficiaire : {beneficiary}
"
                f"• 💳 Mode de règlement : {method}
"
                f"• 🔖 Réf. Pièce : {expense.reference}

"
                f"Votre solde de caisse et vos registres ont été actualisés immédiatement."
            ).replace(",", " "),
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": f"Création et validation comptable de la pièce de dépense {expense.reference}...",
            "action_executed": {
                "type": "expense_created",
                "reference": expense.reference,
                "amount": float(amt),
                "category": category,
            },
            "suggested_actions": [
                {"title": "Consulter les Dépenses", "action_type": "navigate", "payload": {"path": "/espace/depenses"}},
            ],
        }
