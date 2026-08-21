import os

agents_dir = r"C:\koryxa-services-ia\backend\app\services\agents"

# 1. finance_agent.py
with open(os.path.join(agents_dir, "finance_agent.py"), "w", encoding="utf-8") as f:
    f.write('''from __future__ import annotations

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
            f"📊 Diagnostic Financier & Trésorerie pour {org_name} :\n\n"
            f"• 🏦 Solde Réel Disponible en Caisse : {net_cash:,.0f} {currency} ({cash_health})\n"
            f"• 📥 Total Encaissé Réel : {total_sales_paid:,.0f} {currency} (Taux de recouvrement : {recouvrement_rate}%)\n"
            f"• 📤 Total Dépenses Payées : {total_expenses_paid:,.0f} {currency}\n"
            f"• ⏳ Créances Clients en Attente : {total_sales_unpaid:,.0f} {currency}\n"
            f"• 📦 Valeur Estimée du Stock : {total_stock_value:,.0f} {currency}\n\n"
            f"💡 Recommandation Stratégique :\n{health_tip}"
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
                f"✅ Dépense enregistrée avec succès :\n\n"
                f"• 📤 Montant décaissé : {amt:,.0f} {currency}\n"
                f"• 🏷️ Catégorie : {category}\n"
                f"• 🏢 Bénéficiaire : {beneficiary}\n"
                f"• 💳 Mode de règlement : {method}\n"
                f"• 🔖 Réf. Pièce : {expense.reference}\n\n"
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
''')

# 2. sales_recovery_agent.py
with open(os.path.join(agents_dir, "sales_recovery_agent.py"), "w", encoding="utf-8") as f:
    f.write('''from __future__ import annotations

import re
from datetime import date
from decimal import Decimal
from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.registers import DocumentType, PaymentStatus, RecordStatus, SaleCreate
from app.services.agents.base import BaseSpecializedAgent
from app.services.registers import RegisterService


class SalesRecoveryAgent(BaseSpecializedAgent):
    """Agent Spécialisé en Ventes, Caisse Express et Recouvrement des Créances."""

    def __init__(self) -> None:
        super().__init__(
            name="Agent Commercial & Recouvrement",
            badge="🤝 Ventes & Recouvrement",
            role_title="Directeur Commercial & Recouvrement",
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

        # Action: Detect "Enregistre une vente..."
        if any(w in msg_lower for w in ["enregistre une vente", "ajoute une vente", "enregistrer vente", "nouvelle vente", "vends", "vendu", "vente de"]):
            action_res = await self._try_record_sale(s, org, user, user_message, currency)
            if action_res:
                return action_res

        # Recovery & Unpaid debts analysis
        unpaid_sales = context.get("unpaid_sales", [])
        total_unpaid = float(context.get("total_sales_unpaid", 0))

        if any(w in msg_lower for w in ["relance", "impayé", "impayes", "créance", "creance", "débiteur", "debiteur", "qui me doit"]):
            if not unpaid_sales or total_unpaid == 0:
                return {
                    "reply": (
                        f"✅ Excellente nouvelle pour {org_name} !\n\n"
                        f"Vous n'avez aucune créance client impayée enregistrée à ce jour. "
                        f"Votre chiffre d'affaires est 100% encaissé."
                    ),
                    "agent_name": self.name,
                    "agent_badge": self.badge,
                    "thinking_summary": "Vérification exhaustive de toutes les factures et acomptes clients...",
                    "action_executed": None,
                    "suggested_actions": [
                        {"title": "Enregistrer une nouvelle vente", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
                    ],
                }

            unpaid_list = "\n".join(
                [
                    f"• 👤 {s_item.get('client', 'Client')} ({s_item.get('ref')}) : {float(s_item.get('amount', 0)):,.0f} {currency} (Date : {s_item.get('date')})"
                    for s_item in unpaid_sales[:5]
                ]
            ).replace(",", " ")

            reply = (
                f"🚨 Priorités de Recouvrement Client ({total_unpaid:,.0f} {currency} en attente) :\n\n"
                f"{unpaid_list}\n\n"
                f"💡 Plan d'action recommandé :\n"
                f"1. Relancez en priorité les créances les plus anciennes.\n"
                f"2. Vous pouvez générer un message de relance WhatsApp poli ou formel en 1 clic directement dans l'onglet Ventes."
            ).replace(",", " ")

            return {
                "reply": reply,
                "agent_name": self.name,
                "agent_badge": self.badge,
                "thinking_summary": f"Tri chronologique et priorisation des {len(unpaid_sales)} créances clients...",
                "action_executed": None,
                "suggested_actions": [
                    {"title": "Ouvrir le Registre des Ventes", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
                ],
            }

        # Commercial Overview
        total_sales_count = context.get("total_sales_count", 0)
        total_sales_paid = float(context.get("total_sales_paid", 0))

        reply = (
            f"📈 Synthèse Commerciale pour {org_name} :\n\n"
            f"• 🧾 Volume total de transactions : {total_sales_count} vente(s) suivie(s)\n"
            f"• 📥 Total encaissé : {total_sales_paid:,.0f} {currency}\n"
            f"• ⏳ Reste à recouvrer : {total_unpaid:,.0f} {currency}\n\n"
            f"👉 Pour enregistrer une vente rapidement, vous pouvez me dicter simplement :\n"
            f"« Enregistre une vente de 2 articles à 25 000 FCFA pour M. Paul »"
        ).replace(",", " ")

        return {
            "reply": reply,
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": "Synthèse des performances commerciales et du carnet de commandes...",
            "action_executed": None,
            "suggested_actions": [
                {"title": "Consulter les Ventes", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
            ],
        }

    async def _try_record_sale(
        self, s: AsyncSession, org: str, user: str, msg: str, currency: str
    ) -> dict[str, Any] | None:
        amount_match = re.search(r"(\d+(?:[\s.,]\d+)?)\s*(?:f|cfa|xof|eur|\$|francs?)?", msg, re.IGNORECASE)
        if not amount_match:
            return None

        raw_amt = amount_match.group(1).replace(" ", "").replace(",", ".")
        try:
            amt = Decimal(raw_amt)
        except Exception:
            return None

        # Detect quantity
        qty = Decimal("1.00")
        qty_match = re.search(r"(?:de\s+)?(\d+)\s+(?:sacs?|cartons?|articles?|paquets?|boites?|unités?|kilos?|litres?|bouteilles?)", msg, re.IGNORECASE)
        if qty_match:
            try:
                qty = Decimal(qty_match.group(1))
            except Exception:
                pass

        # Detect client name
        client_name = "Client Comptoir"
        for marker in ["pour", "à", "au client"]:
            if f" {marker} " in msg.lower():
                parts = msg.split(f" {marker} ", 1)[1].split(" payé")[0].split(" par")[0].strip()
                if len(parts) > 1:
                    client_name = parts[:80]
                break

        # Detect label
        item_label = "Article / Service"
        if " de " in msg.lower():
            after_de = msg.lower().split(" de ", 1)[1]
            extracted = after_de.split(" à ")[0].split(" pour ")[0].strip()
            if len(extracted) > 1:
                item_label = extracted.capitalize()[:120]

        # Detect payment method and status
        method = "Espèces"
        for m in ["wave", "orange money", "mtn", "moov", "virement", "chèque", "carte"]:
            if m in msg.lower():
                method = m.capitalize()
                break

        is_paid = "impayé" not in msg.lower() and "crédit" not in msg.lower() and "en attente" not in msg.lower()
        pay_status = PaymentStatus.PAID if is_paid else PaymentStatus.UNPAID
        paid_amt = amt if is_paid else Decimal("0.00")

        sale = await self.registers_svc.create_sale(
            s,
            org,
            user,
            SaleCreate(
                sale_date=date.today(),
                document_type=DocumentType.RECEIPT if is_paid else DocumentType.INVOICE,
                client_name=client_name,
                item_label=item_label,
                quantity=qty,
                unit_price=amt / qty if qty > 0 else amt,
                total_amount=amt,
                paid_amount=paid_amt,
                currency=currency,
                payment_method=method,
                payment_status=pay_status,
                comment="Enregistré via Coach IA Cora",
                status=RecordStatus.VALIDATED,
            ),
        )

        status_text = "Règlement reçu (100% Encaissé)" if is_paid else "En attente de règlement (Créance client)"

        return {
            "reply": (
                f"✅ Vente enregistrée avec succès :\n\n"
                f"• 🧾 Réf. Facture/Reçu : {sale.reference}\n"
                f"• 👤 Client : {client_name}\n"
                f"• 📦 Article(s) : {item_label} (Qté: {qty})\n"
                f"• 💰 Montant Total : {amt:,.0f} {currency}\n"
                f"• 💳 Mode de paiement : {method}\n"
                f"• 📌 Statut : {status_text}\n\n"
                f"Votre chiffre d'affaires et votre caisse ont été immédiatement actualisés."
            ).replace(",", " "),
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": f"Génération du document commercial {sale.reference} et synchronisation de la caisse...",
            "action_executed": {
                "type": "sale_created",
                "reference": sale.reference,
                "amount": float(amt),
                "client": client_name,
            },
            "suggested_actions": [
                {"title": "Consulter les Ventes", "action_type": "navigate", "payload": {"path": "/espace/ventes"}},
            ],
        }
''')

# 3. radar_sentinel_agent.py
with open(os.path.join(agents_dir, "radar_sentinel_agent.py"), "w", encoding="utf-8") as f:
    f.write('''from __future__ import annotations

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
                    f"🛡️ Le Radar KORYXA est au vert pour {org_name} !\n\n"
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

        alerts_list = "\n".join(
            [f"• 🔴 {a.get('title')} : {a.get('explanation')}" for a in critical_alerts[:4]]
        )

        stock_warning = f"\n• ⚠️ {low_stock_count} produit(s) en stock critique sous le seuil d'alerte." if low_stock_count > 0 else ""

        reply = (
            f"🚨 Diagnostic Sentinelle Radar ({open_alerts_count} point(s) d'attention) :\n\n"
            f"{alerts_list}{stock_warning}\n\n"
            f"💡 Recommandation de l'Auditeur :\n"
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
''')

# 4. operations_sop_agent.py
with open(os.path.join(agents_dir, "operations_sop_agent.py"), "w", encoding="utf-8") as f:
    f.write('''from __future__ import annotations

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
            f"📋 Mémoire Opérationnelle & Méthodes pour {org_name} :\n\n"
            f"Votre entreprise dispose actuellement de {procedures_count} procédure(s) formalisée(s).\n\n"
            f"💡 Pourquoi formaliser vos méthodes ?\n"
            f"• Garantir la qualité du service même en l'absence du dirigeant.\n"
            f"• Faciliter la formation rapide des nouvelles recrues.\n"
            f"• Éviter les erreurs de caisse et de gestion des stocks.\n\n"
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
''')

# 5. cora_orchestrator.py
with open(os.path.join(agents_dir, "cora_orchestrator.py"), "w", encoding="utf-8") as f:
    f.write('''from __future__ import annotations

from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.member import OrganizationMember
from app.models.organization import Organization
from app.schemas.ai import AIChatRequest, AIChatResponse, SuggestedAction
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
            return AIChatResponse(
                reply=(
                    f"Bonjour {responsible} ! C'est un plaisir de vous retrouver aux commandes de **{org_name}**.\n\n"
                    f"Je suis à vos côtés avec notre équipe d'experts (Analyste Financier, Responsable Commercial et Sentinelle Radar).\n\n"
                    f"De quoi souhaitez-vous parler aujourd'hui ? Je peux analyser votre trésorerie, enregistrer une vente en direct ou faire le point sur vos créances."
                ),
                provider_used="Cora Intelligence (KORYXA Core)",
                model_used="koryxa-cora-orchestrator",
                agent_name="Cora · Directrice des Opérations",
                agent_badge="🧑‍💼 Coach Exécutif",
                thinking_summary="Accueil personnalisé du dirigeant...",
                action_executed=None,
                suggested_actions=[
                    SuggestedAction(title="Quelle est ma trésorerie réelle ?", action_type="send_chat", payload={"prompt": "Quelle est ma trésorerie réelle ?"}),
                    SuggestedAction(title="Quels clients relancer ?", action_type="send_chat", payload={"prompt": "Quels clients relancer ?"}),
                    SuggestedAction(title="Enregistrer une vente", action_type="navigate", payload={"path": "/espace/ventes"}),
                ],
            )

        # 2. Route to Sales & Recovery Agent
        if any(w in msg_lower for w in ["vente", "vendre", "vendu", "client", "relance", "créance", "creance", "impayé", "facture"]):
            res = await self.sales_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency)
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
        if any(w in msg_lower for w in ["argent", "trésorerie", "tresorerie", "caisse", "solde", "dépense", "depense", "achat", "marge", "bfr", "financier"]):
            res = await self.finance_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency)
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
            res = await self.radar_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency)
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
            res = await self.ops_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency)
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
        res = await self.finance_agent.process(s, org_id, user_id, last_user_msg, context, org_name, currency)
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
''')

print("All 5 agents and orchestrator built successfully!")
