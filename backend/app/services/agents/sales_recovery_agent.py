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
        domain: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        msg_lower = user_message.lower()
        domain = domain or {}
        sector_label = domain.get("sector_label", "Commerce & Entreprise")
        agent_role = domain.get("role_sales", self.role_title)
        is_education = (
            "scol" in sector_label.lower()
            or "ecole" in sector_label.lower()
            or "éduc" in sector_label.lower()
        )

        # Action: Detect "Enregistre une vente / écolage / scolarité..."
        sale_triggers = [
            "enregistre une vente",
            "ajoute une vente",
            "enregistrer vente",
            "nouvelle vente",
            "vends",
            "vendu",
            "vente de",
            "enregistre l'écolage",
            "enregistre l'ecolage",
            "encaisse l'écolage",
            "encaisse l'ecolage",
            "paiement scolarité",
            "paiement écolage",
            "scolarité de",
            "écolage de",
            "tranche de",
            "inscription de",
            "encaissement de",
            "enregistre l'inscription",
        ]
        if any(w in msg_lower for w in sale_triggers):
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
            f"Tu es le {agent_role} spécialisé dans le secteur : {sector_label}.\n"
            f"Entreprise / Établissement : {org_name}\n"
            f"Devise de compte : {currency}\n\n"
            f"Règles et expertise métier sectorielle :\n"
            f"{domain.get('kpi_rules', '')}\n\n"
            f"Situation commerciale réelle :\n"
            f"- Nombre d'enregistrements : {total_sales_count}\n"
            f"- Total facturé / écolages dus : {total_sales_amount:,.0f} {currency}\n"
            f"- Total Encaissé en caisse : {total_sales_paid:,.0f} {currency}\n"
            f"- Reste à recouvrer / Impayés : {total_sales_unpaid:,.0f} {currency}\n"
            f"- Éléments en attente : {unpaid_sales[:5]}\n\n"
            f"Demande de l'utilisateur : {user_message}\n\n"
            f"Consigne : Adopte le vocabulaire exact du secteur ({'Écolages, Élèves, Parents, Tranches' if is_education else 'Ventes, Clients, Factures, Devis'}). Donne des conseils concrets et actionnables. Sans aucun markdown brut **."
        )

        reply = await self.call_knowlia_llm(s, org, user, llm_prompt)

        if not reply:
            client_word = "l'élève / parent" if is_education else "le client"
            if any(
                w in msg_lower
                for w in [
                    "chiffre d'affaire",
                    "chiffre d'affaires",
                    "ca",
                    "chiffre daffaire",
                    "recette",
                    "recettes",
                    "total vente",
                    "total des ventes",
                    "combien j'ai vendu",
                    "combien on a vendu",
                    "revenu",
                ]
            ):
                total_ca = total_sales_amount
                ca_encaisse = total_sales_paid
                ca_attente = total_sales_unpaid
                taux = round((ca_encaisse / total_ca * 100) if total_ca > 0 else 100)

                reply = (
                    f"📈 Point sur le Chiffre d'Affaires de {org_name} :\n\n"
                    f"• 💰 Chiffre d'Affaires Total Facturé : {total_ca:,.0f} {currency}\n"
                    f"• 📥 CA Réellement Encaissé en Caisse : {ca_encaisse:,.0f} {currency} ({taux}% du total)\n"
                    f"• ⏳ CA en Attente d'Encaissement : {ca_attente:,.0f} {currency}\n"
                    f"• 🧾 Volume d'Opérations : {total_sales_count} transaction(s) enregistrée(s)\n\n"
                    f"💡 Conseil de votre {agent_role} :\n"
                    f"Votre activité a généré {total_ca:,.0f} {currency} au total. "
                    f"Pour sécuriser vos rentrées, vous avez {ca_attente:,.0f} {currency} à encaisser auprès des clients en compte."
                ).replace(",", " ")

            elif any(
                w in msg_lower
                for w in [
                    "relance",
                    "impayé",
                    "impayes",
                    "créance",
                    "creance",
                    "débiteur",
                    "debiteur",
                    "qui me doit",
                ]
            ):
                if not unpaid_sales or total_sales_unpaid == 0:
                    reply = (
                        f"✅ Situation Saine pour {org_name} !\n\n"
                        f"Tous les règlements sont 100% à jour. Vous n'avez aucun impayé en attente de recouvrement."
                    )
                else:
                    unpaid_list = "\n".join(
                        [
                            f"• 👤 {s_item.get('client', 'Débiteur')} (Réf. {s_item.get('ref')}) : {float(s_item.get('amount', 0)):,.0f} {currency} (Date : {s_item.get('date')})"
                            for s_item in unpaid_sales[:5]
                        ]
                    ).replace(",", " ")

                    reply = (
                        f"🚨 Plan de Recouvrement Prioritaire ({total_sales_unpaid:,.0f} {currency} en attente) :\n\n"
                        f"{unpaid_list}\n\n"
                        f"💡 Recommandations de votre {agent_role} :\n"
                        f"1. Relancez en priorité {client_word} ayant plus de 7 jours de retard.\n"
                        f"2. Modèle de relance suggéré :\n"
                        f"{domain.get('example_relance', '').format(eleve='Paul', tranche='2ème tranche', montant=f'{total_sales_unpaid:,.0f} {currency}', date='lundi prochain', client='Monsieur', ref='FAC-001')}"
                    ).replace(",", " ")
            else:
                reply = (
                    f"📈 Synthèse des Opérations pour {org_name} ({sector_label}) :\n\n"
                    f"• 🧾 Volume total : {total_sales_count} opération(s) enregistrée(s)\n"
                    f"• 📥 Total encaissé : {total_sales_paid:,.0f} {currency}\n"
                    f"• ⏳ Reste à recouvrer : {total_sales_unpaid:,.0f} {currency}\n\n"
                    f"👉 Pour enregistrer un encaissement rapidement, dictez-moi simplement :\n"
                    f"« {'Enregistre le paiement de 45 000 FCFA pour l’élève Kofi en 3ème A' if is_education else 'Enregistre une vente de 25 000 FCFA pour M. Paul'} »"
                ).replace(",", " ")

        return {
            "reply": reply,
            "agent_name": f"{agent_role} (KORYXA Expert)",
            "agent_badge": "🎓 Recouvrement Écolages"
            if is_education
            else "🤝 Ventes & Recouvrement",
            "thinking_summary": f"Analyse commerciale adaptée au secteur {sector_label}...",
            "action_executed": None,
            "suggested_actions": [
                {
                    "title": "Consulter les Ventes",
                    "action_type": "navigate",
                    "payload": {"path": "/espace/ventes"},
                },
            ],
        }

    async def _try_record_sale(
        self, s: AsyncSession, org: str, user: str, msg: str, currency: str
    ) -> dict[str, Any] | None:
        msg_clean = msg.strip()
        msg_lower = msg_clean.lower()

        # 1. Detect Quantity
        qty = Decimal("1.00")
        qty_match = re.search(
            r"(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(cartons?|sacs?|paquets?|boites?|boîtes?|bouteilles?|unités?|kilos?|kg|litres?|l|articles?|pièces?|pcs?)?",
            msg_lower,
        )
        if qty_match:
            try:
                qty = Decimal(qty_match.group(1).replace(",", "."))
            except Exception:
                pass

        # 2. Detect Unit Price or Total Price
        unit_price_match = re.search(
            r"(?:à|a|au prix de)\s*(\d+(?:[\s.,]\d+)?)\s*(?:f|cfa|xof|eur|\$|francs?)?(?:\s*(?:l'un|le|la|un|une|par|chaque))?",
            msg_lower,
        )
        total_amount_match = re.search(
            r"(?:pour un total de|total de|montant de|pour)\s*(\d+(?:[\s.,]\d+)?)\s*(?:f|cfa|xof|eur|\$|francs?)?",
            msg_lower,
        )

        all_numbers = [
            Decimal(m.group(1).replace(" ", "").replace(",", "."))
            for m in re.finditer(r"(\d+(?:[\s.,]\d+)?)\s*(?:f|cfa|xof|eur|\$|francs?)", msg_lower)
            if m.group(1).strip()
        ]

        unit_price = Decimal("0.00")
        total_amount = Decimal("0.00")

        if unit_price_match:
            raw_u = unit_price_match.group(1).replace(" ", "").replace(",", ".")
            try:
                unit_price = Decimal(raw_u)
                total_amount = unit_price * qty
            except Exception:
                pass
        elif total_amount_match:
            raw_t = total_amount_match.group(1).replace(" ", "").replace(",", ".")
            try:
                total_amount = Decimal(raw_t)
                unit_price = total_amount / qty if qty > 0 else total_amount
            except Exception:
                pass
        elif all_numbers:
            val = all_numbers[-1]
            if qty > 1 and val < 50000 and "un " in msg_lower:
                unit_price = val
                total_amount = unit_price * qty
            else:
                total_amount = val
                unit_price = total_amount / qty if qty > 0 else total_amount
        else:
            standalone = re.findall(r"\b(\d+)\b", msg_lower)
            if len(standalone) >= 2:
                try:
                    n1 = Decimal(standalone[0])
                    n2 = Decimal(standalone[1])
                    if n1 == qty:
                        unit_price = n2
                        total_amount = n1 * n2
                    else:
                        total_amount = n2
                        unit_price = total_amount / qty if qty > 0 else total_amount
                except Exception:
                    pass

        if total_amount <= 0:
            return None

        # 3. Detect Client Name
        client_name = "Client Comptoir"
        client_patterns = [
            r"(?:par le client|au client|pour le client|du client|client|de la part de|par|pour)\s+([A-Za-zÀ-ÿ0-9_\-\s]{2,40})?(?:\s+(?:et|payé|règlement|reglement|en|avec|sur|via|date|qui|dont))?",
        ]
        for cp in client_patterns:
            cm = re.search(cp, msg_clean, re.IGNORECASE)
            if cm and cm.group(1):
                raw_c = cm.group(1).strip()
                for stop_word in [
                    " et",
                    " payé",
                    " paye",
                    " regler",
                    " avec",
                    " via",
                    " moov",
                    " orange",
                    " wave",
                    " mtn",
                    " espece",
                    " espèces",
                ]:
                    if stop_word in raw_c.lower():
                        raw_c = raw_c[: raw_c.lower().index(stop_word)].strip()
                if len(raw_c) >= 2 and raw_c.lower() not in [
                    "moi",
                    "une",
                    "un",
                    "la",
                    "le",
                    "des",
                    "les",
                    "vente",
                ]:
                    client_name = raw_c.title()
                    break

        # 4. Detect Item Label
        item_label = "Article / Marchandise"
        item_match = re.search(
            r"(?:vente de|vente d'|vente|vendu|pour)\s+(\d+\s+)?([A-Za-zÀ-ÿ0-9_\-\s]{2,50})?\s+(?:à|a\s+\d|au prix|pour|effectu|effectué|par|payé)",
            msg_clean,
            re.IGNORECASE,
        )
        if item_match and item_match.group(2):
            raw_i = item_match.group(2).strip()
            if len(raw_i) >= 2:
                item_label = raw_i.title()
        else:
            if " de " in msg_lower:
                parts = (
                    msg_clean.split(" de ", 1)[1]
                    .split(" à ")[0]
                    .split(" a ")[0]
                    .split(" pour ")[0]
                    .strip()
                )
                if len(parts) >= 2:
                    item_label = parts.title()

        # 5. Detect Payment Method
        payment_method = "Espèces"
        methods_map = {
            "moov money": "Moov Money",
            "moov": "Moov Money",
            "orange money": "Orange Money",
            "orange": "Orange Money",
            "mtn money": "MTN Mobile Money",
            "mtn": "MTN Mobile Money",
            "wave": "Wave",
            "virement": "Virement bancaire",
            "chèque": "Chèque",
            "cheque": "Chèque",
            "carte": "Carte bancaire",
            "espèces": "Espèces",
            "espece": "Espèces",
            "cash": "Espèces",
        }
        for k, v in methods_map.items():
            if k in msg_lower:
                payment_method = v
                break

        # 6. Payment Status
        is_paid = (
            "impayé" not in msg_lower
            and "impaye" not in msg_lower
            and "crédit" not in msg_lower
            and "credit" not in msg_lower
            and "en attente" not in msg_lower
            and "non payé" not in msg_lower
        )
        pay_status = PaymentStatus.PAID if is_paid else PaymentStatus.UNPAID
        paid_amount = total_amount if is_paid else Decimal("0.00")

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
                unit_price=unit_price,
                total_amount=total_amount,
                paid_amount=paid_amount,
                currency=currency,
                payment_method=payment_method,
                payment_status=pay_status,
                comment="Enregistré via Copilote IA Cora",
                status=RecordStatus.VALIDATED,
            ),
        )

        status_text = (
            "Règlement reçu (100% Encaissé)"
            if is_paid
            else "En attente de règlement (Créance client)"
        )

        return {
            "reply": (
                f"✅ Vente enregistrée et comptabilisée avec succès :\n\n"
                f"• 🧾 Réf. Reçu/Facture : {sale.reference}\n"
                f"• 👤 Client : {client_name}\n"
                f"• 📦 Article(s) : {item_label} (Quantité : {qty:,.0f})\n"
                f"• 💰 Prix unitaire : {unit_price:,.0f} {currency}\n"
                f"• 💵 Montant Total : {total_amount:,.0f} {currency}\n"
                f"• 💳 Mode de règlement : {payment_method}\n"
                f"• 📌 Statut : {status_text}\n\n"
                f"Votre chiffre d'affaires et votre solde de caisse ont été immédiatement actualisés."
            ).replace(",", " "),
            "agent_name": self.name,
            "agent_badge": self.badge,
            "thinking_summary": f"Génération du document commercial {sale.reference} et mise à jour de la caisse...",
            "action_executed": {
                "type": "sale_created",
                "reference": sale.reference,
                "amount": float(total_amount),
                "client": client_name,
            },
            "suggested_actions": [
                {
                    "title": "Consulter les Ventes",
                    "action_type": "navigate",
                    "payload": {"path": "/espace/ventes"},
                },
                {
                    "title": "Point de trésorerie",
                    "action_type": "send_chat",
                    "payload": {
                        "prompt": "Quelle est ma trésorerie réelle et mon solde de caisse ?"
                    },
                },
            ],
        }
