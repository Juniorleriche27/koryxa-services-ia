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
            system_prompt=(
                "Tu es le Directeur Commercial et Responsable du Recouvrement de KORYXA. "
                "Tu maîtrises parfaitement les stratégies de conversion client, la gestion du carnet de commandes, "
                "la négociation d'acomptes, et les techniques de relance des factures impayées (B2B et B2C). "
                "Tu rédiges des réponses claires, motivantes et professionnelles, sans aucun markdown brut (pas de doubles astérisques **)."
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
    ) -> dict[str, Any]:
        msg_lower = user_message.lower()

        # Action: Detect "Enregistre une vente..."
        if any(w in msg_lower for w in ["enregistre une vente", "ajoute une vente", "enregistrer vente", "nouvelle vente", "vends", "vendu", "vente de"]):
            action_res = await self._try_record_sale(s, org, user, user_message, currency)
            if action_res:
                return action_res

        # Recovery & Unpaid debts analysis
        total_sales_count = context.get("total_sales_count", 0)
        total_sales_amount = float(context.get("total_sales_amount", 0))
        total_sales_paid = float(context.get("total_sales_paid", 0))
        total_sales_unpaid = float(context.get("total_sales_unpaid", 0))
        unpaid_sales = context.get("unpaid_sales", [])

        llm_prompt = (
            f"{self.system_prompt}\n\n"
            f"Entreprise : {org_name}\n"
            f"Devise : {currency}\n"
            f"Situation commerciale réelle :\n"
            f"- Nombre de ventes : {total_sales_count}\n"
            f"- Chiffre d'affaires facturé : {total_sales_amount:,.0f} {currency}\n"
            f"- Total Encaissé : {total_sales_paid:,.0f} {currency}\n"
            f"- Créances clients impayées : {total_sales_unpaid:,.0f} {currency}\n"
            f"- Factures en attente : {unpaid_sales[:5]}\n\n"
            f"Demande du dirigeant : {user_message}\n\n"
            f"Consigne : Réponds en responsable commercial expert. Sans aucun ** dans le texte."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            if any(w in msg_lower for w in ["relance", "impayé", "impayes", "créance", "creance", "débiteur", "debiteur", "qui me doit"]):
                if not unpaid_sales or total_sales_unpaid == 0:
                    reply = (
                        f"✅ Situation Commerciale Saine pour {org_name} !\n\n"
                        f"Toutes vos factures sont 100% réglées. Vous n'avez aucune créance client en souffrance."
                    )
                else:
                    unpaid_list = "\n".join(
                        [
                            f"• 👤 {s_item.get('client', 'Client')} (Réf. {s_item.get('ref')}) : {float(s_item.get('amount', 0)):,.0f} {currency} (Date : {s_item.get('date')})"
                            for s_item in unpaid_sales[:5]
                        ]
                    ).replace(",", " ")

                    reply = (
                        f"🚨 Plan de Recouvrement Client Prioritaire ({total_sales_unpaid:,.0f} {currency} en attente) :\n\n"
                        f"{unpaid_list}\n\n"
                        f"💡 Recommandation du Responsable Commercial :\n"
                        f"1. Relancez en priorité les clients ayant plus de 7 jours de retard.\n"
                        f"2. Vous pouvez générer un message de relance WhatsApp en 1 clic directement dans l'onglet Ventes."
                    ).replace(",", " ")
            else:
                reply = (
                    f"📈 Synthèse Commerciale pour {org_name} :\n\n"
                    f"• 🧾 Volume total de transactions : {total_sales_count} vente(s) suivie(s)\n"
                    f"• 📥 Total encaissé : {total_sales_paid:,.0f} {currency}\n"
                    f"• ⏳ Reste à recouvrer : {total_sales_unpaid:,.0f} {currency}\n\n"
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
                f"✅ Vente enregistrée et comptabilisée avec succès :\n\n"
                f"• 🧾 Réf. Facture/Reçu : {sale.reference}\n"
                f"• 👤 Client : {client_name}\n"
                f"• 📦 Article(s) : {item_label} (Quantité: {qty})\n"
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
