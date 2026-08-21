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
            system_prompt=(
                "Tu es l'Analyste Financier et Trésorier expert de KORYXA. "
                "Tu analyses la trésorerie nette, le taux de recouvrement, le Besoin en Fonds de Roulement (BFR), "
                "la rentabilité des ventes et l'optimisation des dépenses. "
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
        is_education = "scol" in sector_label.lower() or "ecole" in sector_label.lower() or "éduc" in sector_label.lower()

        # Action: Detect "Enregistre une dépense / vacation / charge..."
        expense_triggers = [
            "enregistre une dépense", "enregistre la dépense", "ajoute une dépense", "enregistrer dépense",
            "nouvelle dépense", "payé une dépense", "dépense de", "règlement vacation", "reglement vacation",
            "vacation de", "salaire de", "achat fourniture", "décaissement de", "decaissement de",
        ]
        if any(w in msg_lower for w in expense_triggers):
            action_res = await self._try_record_expense(s, org, user, user_message, currency)
            if action_res:
                return action_res

        # Financial Diagnostic & Cashflow Analysis
        total_sales_amount = float(context.get("total_sales_amount", 0))
        total_sales_paid = float(context.get("total_sales_paid", 0))
        total_expenses_paid = float(context.get("total_expenses_paid", 0))
        total_sales_unpaid = float(context.get("total_sales_unpaid", 0))
        net_cash = total_sales_paid - total_expenses_paid
        total_stock_value = float(context.get("total_stock_value", 0))

        recouvrement_rate = (
            round((total_sales_paid / total_sales_amount) * 100)
            if total_sales_amount > 0
            else 100
        )

        llm_prompt = (
            f"Tu es le {agent_role} expert pour : {sector_label}.\n"
            f"Organisation : {org_name}\n"
            f"Devise : {currency}\n\n"
            f"Règles financières sectorielles :\n"
            f"{domain.get('kpi_rules', '')}\n\n"
            f"Données comptables vérifiées :\n"
            f"- Total facturé / recettes attendues : {total_sales_amount:,.0f} {currency}\n"
            f"- Total Encaissé en caisse : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"- Sommes en attente d'encaissement : {total_sales_unpaid:,.0f} {currency}\n"
            f"- Dépenses / Vacations réglées : {total_expenses_paid:,.0f} {currency}\n"
            f"- Solde Net réel de caisse (Encaissé - Dépensé) : {net_cash:,.0f} {currency}\n\n"
            f"Demande de l'utilisateur : {user_message}\n\n"
            f"Consigne : Adopte le ton d'un {agent_role} bienveillant, direct et orienté rentabilité. Sans aucun markdown brut **."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            # Financial Health Status
            if net_cash > 0:
                cash_health = f"Solde Net Positif (+{net_cash:,.0f} {currency})".replace(",", " ")
                health_tip = "Votre trésorerie est saine et vous permet de couvrir vos charges opérationnelles sereinement."
            elif net_cash == 0:
                cash_health = f"Solde à l'Équilibre (0 {currency})"
                health_tip = "Vos entrées couvrent tout juste vos sorties. Il est prioritaire d'accélérer les encaissements."
            else:
                cash_health = f"Déficit Temporaire ({net_cash:,.0f} {currency})".replace(",", " ")
                health_tip = "Attention : vos sorties de fonds dépassent vos encaissements actuels. Récupérez en priorité les créances en attente."

            reply = (
                f"📊 Diagnostic Financier pour {org_name} ({sector_label}) :\n\n"
                f"• 🏦 Solde Réel Disponible en Caisse : {net_cash:,.0f} {currency} ({cash_health})\n"
                f"• 📥 Total Encaissé : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
                f"• 📤 Total Charges & Dépenses Payées : {total_expenses_paid:,.0f} {currency}\n"
                f"• ⏳ Reste à Recouvrer : {total_sales_unpaid:,.0f} {currency}\n\n"
                f"💡 Recommandation de l'expert :\n{health_tip}"
            ).replace(",", " ")

        return {
            "reply": reply,
            "agent_name": f"{agent_role} (KORYXA Expert)",
            "agent_badge": "🎓 Intendance & Trésorerie" if is_education else "📊 Finance & Trésorerie",
            "thinking_summary": f"Analyse rigoureuse de la trésorerie et conformité ({sector_label})...",
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
                f"✅ Dépense enregistrée et décaissée avec succès :\n\n"
                f"• 📤 Montant décaissé : {amt:,.0f} {currency}\n"
                f"• 🏷️ Catégorie : {category}\n"
                f"• 🏢 Bénéficiaire : {beneficiary}\n"
                f"• 💳 Mode de règlement : {method}\n"
                f"• 🔖 Réf. Pièce de Caisse : {expense.reference}\n\n"
                f"Votre solde réel de caisse et votre registre des achats ont été immédiatement mis à jour."
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
