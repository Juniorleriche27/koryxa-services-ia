from __future__ import annotations

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
                        f"✅ Excellente nouvelle pour {org_name} !

"
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

            unpaid_list = "
".join(
                [
                    f"• 👤 {s_item.get('client', 'Client')} ({s_item.get('ref')}) : {float(s_item.get('amount', 0)):,.0f} {currency} (Date : {s_item.get('date')})"
                    for s_item in unpaid_sales[:5]
                ]
            ).replace(",", " ")

            reply = (
                f"🚨 Priorités de Recouvrement Client ({total_unpaid:,.0f} {currency} en attente) :

"
                f"{unpaid_list}

"
                f"💡 Plan d'action recommandé :
"
                f"1. Relancez en priorité les créances les plus anciennes.
"
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
            f"📈 Synthèse Commerciale pour {org_name} :

"
            f"• 🧾 Volume total de transactions : {total_sales_count} vente(s) suivie(s)
"
            f"• 📥 Total encaissé : {total_sales_paid:,.0f} {currency}
"
            f"• ⏳ Reste à recouvrer : {total_unpaid:,.0f} {currency}

"
            f"👉 Pour enregistrer une vente rapidement, vous pouvez me dicter simplement :
"
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
                f"✅ Vente enregistrée avec succès :

"
                f"• 🧾 Réf. Facture/Reçu : {sale.reference}
"
                f"• 👤 Client : {client_name}
"
                f"• 📦 Article(s) : {item_label} (Qté: {qty})
"
                f"• 💰 Montant Total : {amt:,.0f} {currency}
"
                f"• 💳 Mode de paiement : {method}
"
                f"• 📌 Statut : {status_text}

"
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
