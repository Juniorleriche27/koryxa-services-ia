import os

backend_service_path = r"C:\koryxa-services-ia\backend\app\services\voice.py"
frontend_modal_path = r"C:\koryxa-services-ia\frontend\components\app\VoiceCaptureModal.tsx"

# 1. Update backend/app/services/voice.py
backend_voice_content = '''from __future__ import annotations

import re
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.registers import PaymentStatus, RecordSource
from app.schemas.registers import ExpenseCreate, OfferCreate, ProcedureCreate, SaleCreate, StepInput
from app.schemas.voice import (
    VoiceConfirmRequest,
    VoiceExpenseCandidate,
    VoiceIntent,
    VoiceOfferCandidate,
    VoiceParseRequest,
    VoiceParseResponse,
    VoiceProcedureCandidate,
    VoiceSaleCandidate,
)
from app.services.registers import RegisterService


def clean_speech_duplicates(text: str) -> str:
    """Intelligently removes multi-word stuttering and duplicate phrases caused by mobile speech recognition."""
    if not text:
        return ""
    t = text.strip()
    # 1. Strip multi-word duplicated phrases e.g. "vente de 10 cartons vente de 10 cartons"
    for _ in range(3):
        t = re.sub(r"\\b(.+?)\\s+\\1\\b", r"\\1", t, flags=re.IGNORECASE)
    # 2. Strip single repeated words e.g. "koffi koffi"
    t = re.sub(r"\\b(\\w+)\\s+\\1\\b", r"\\1", t, flags=re.IGNORECASE)
    return re.sub(r"\\s+", " ", t).strip()


class VoiceService:
    def __init__(self, register_service: RegisterService | None = None) -> None:
        self.register_service = register_service or RegisterService()

    def parse_transcript(self, request: VoiceParseRequest) -> VoiceParseResponse:
        text = clean_speech_duplicates(request.transcript.strip())
        lower = text.lower()

        # Determine Intent
        intent = VoiceIntent.UNKNOWN
        if any(w in lower for w in ["dépense", "depense", "achat carburant", "achat fournitures", "charge", "frais", "décaissement", "decaissement", "payé fournisseur", "achat matériel", "loyer", "électricité", "facture fournisseur", "carburant"]):
            intent = VoiceIntent.EXPENSE
        elif any(w in lower for w in ["vente", "vendu", "encaissé", "facturé", "achat client", "vends", "client"]):
            intent = VoiceIntent.SALE
        elif any(w in lower for w in ["procédure", "processus", "méthode", "étapes", "consigne", "protocole"]):
            intent = VoiceIntent.PROCEDURE
        elif any(w in lower for w in ["offre", "tarif", "prix officiel", "prestation", "catalogue"]):
            intent = VoiceIntent.OFFER
        else:
            # Default heuristics: if numbers and client/product mentioned, assume sale
            if re.search(r"\\b\\d+[\\s\\d]*\\b", text):
                intent = VoiceIntent.SALE

        if intent == VoiceIntent.SALE:
            return self._parse_sale(text)
        elif intent == VoiceIntent.EXPENSE:
            return self._parse_expense(text)
        elif intent == VoiceIntent.PROCEDURE:
            return self._parse_procedure(text)
        elif intent == VoiceIntent.OFFER:
            return self._parse_offer(text)

        return VoiceParseResponse(
            intent=VoiceIntent.UNKNOWN,
            confidence=0.2,
            original_transcript=text,
            summary_message="Impossible de déterminer précisément s'il s'agit d'une vente, d'une dépense, d'une offre ou d'une procédure.",
        )

    def _extract_amounts(self, text: str) -> list[Decimal]:
        t = text.lower()
        word_numbers = {
            "dix-huit mille": "18000",
            "dix huit mille": "18000",
            "quarante-cinq mille": "45000",
            "quarante cinq mille": "45000",
            "trente-cinq mille": "35000",
            "trente cinq mille": "35000",
            "vingt-cinq mille": "25000",
            "vingt cinq mille": "25000",
            "soixante-quinze mille": "75000",
            "soixante quinze mille": "75000",
            "cinquante mille": "50000",
            "trente mille": "30000",
            "vingt mille": "20000",
            "quinze mille": "15000",
            "dix mille": "10000",
            "cent mille": "100000",
            "cinq mille": "5000",
            "deux mille": "2000",
            "trois mille": "3000",
            "quatre mille": "4000",
            "six mille": "6000",
            "sept mille": "7000",
            "huit mille": "8000",
            "neuf mille": "9000",
            "un million": "1000000",
            "deux millions": "2000000",
        }
        for w, num_str in word_numbers.items():
            t = re.sub(rf"\\b{w}\\b", num_str, t)

        t = re.sub(r"\\b(\\d+)\\s*(?:mille|k)\\b", lambda m: str(int(m.group(1)) * 1000), t)
        normalized = re.sub(r"(?i)\\b(fcfa|cfa|francs?|f|euros?|€|dollars?|\\$)\\b", "", t)
        matches = re.findall(r"\\b\\d+(?:[\\s\\.]\\d{3})*(?:,\\d+)?\\b|\\b\\d+(?:,\\d+)?\\b", normalized)
        results: list[Decimal] = []
        for m in matches:
            clean_str = m.replace(" ", "").replace(".", "").replace(",", ".")
            try:
                val = Decimal(clean_str)
                if val > 0:
                    results.append(val)
            except Exception:
                continue
        return results

    def _extract_currency(self, text: str, default_currency: str = "XOF") -> str:
        if re.search(r"(?i)\\b(?:euros?|eur|€)\\b", text):
            return "EUR"
        if re.search(r"(?i)\\b(?:dollars?|usd|\\$|cad)\\b", text):
            return "USD"
        if re.search(r"(?i)\\b(?:livres?|gbp|£)\\b", text):
            return "GBP"
        if re.search(r"(?i)\\b(?:dirhams?|mad|dhs?)\\b", text):
            return "MAD"
        if re.search(r"(?i)\\b(?:dinars?|tnd|dzd)\\b", text):
            return "TND"
        if re.search(r"(?i)\\b(?:nairas?|ngn|₦)\\b", text):
            return "NGN"
        if re.search(r"(?i)\\b(?:cedis?|ghs|₵)\\b", text):
            return "GHS"
        if re.search(r"(?i)\\b(?:shillings?|kes)\\b", text):
            return "KES"
        if re.search(r"(?i)\\b(?:guinéens?|guineens?|gnf)\\b", text):
            return "GNF"
        if re.search(r"(?i)\\b(?:congolais|cdf)\\b", text):
            return "CDF"
        if re.search(r"(?i)\\b(?:rwandais|rwf)\\b", text):
            return "RWF"
        if re.search(r"(?i)\\b(?:ariary|mga)\\b", text):
            return "MGA"
        if re.search(r"(?i)\\b(?:cemac|xaf)\\b", text):
            return "XAF"
        if re.search(r"(?i)\\b(?:cfa|fcfa|f cfa|uemoa|xof)\\b", text):
            return "XOF"
        if re.search(r"(?i)\\b(?:francs?|f)\\b", text):
            return default_currency
        return default_currency

    def _extract_payment_method(self, text: str) -> tuple[str | None, PaymentStatus]:
        lower = text.lower()
        methods = [
            ("Moov Money", ["moov money", "moov", "flooz"]),
            ("T-Money", ["t-money", "tmoney", "t money", "togocel"]),
            ("Wave", ["wave", "wave money"]),
            ("Orange Money", ["orange money", "orange"]),
            ("MTN Mobile Money", ["mtn money", "momo", "mtn mobile money", "mtn"]),
            ("Airtel Money", ["airtel money", "airtel"]),
            ("Mixx by Yas", ["mixx by yas", "mixx"]),
            ("Espèces", ["espèces", "especes", "cash", "en liquide", "liquide", "main à main", "au comptant"]),
            ("Virement Bancaire", ["virement bancaire", "virement", "compte bancaire"]),
            ("Chèque", ["chèque", "cheque"]),
            ("Carte Bancaire", ["carte bancaire", "carte", "cb", "visa", "mastercard"]),
        ]

        detected_method: str | None = None
        for name, aliases in methods:
            if any(re.search(rf"\\b{re.escape(alias)}\\b", lower) for alias in aliases):
                detected_method = name
                break

        # Status checks
        if any(w in lower for w in ["non payé", "non payee", "non paye", "impayé", "impayee", "impaye", "à crédit", "a credit", "crédit", "credit", "reste à payer", "en attente"]):
            status = PaymentStatus.UNPAID
        elif any(w in lower for w in ["partiel", "partielle", "acompte", "avance", "partiellement"]):
            status = PaymentStatus.PARTIAL
        elif any(w in lower for w in ["payé", "payee", "paye", "encaissé", "encaissee", "encaisse", "réglé", "regle", "soldé", "solde"]) or detected_method:
            status = PaymentStatus.PAID
        else:
            status = PaymentStatus.UNPAID

        return detected_method, status

    def _extract_client_name(self, text: str) -> str | None:
        client_patterns = [
            r"(?i)(?:(?:effectué|effectue|passé|passe|fait)\s+)?par\s+le\s+client\s+([A-ZÀ-Ÿa-zà-ÿ0-9\s'-]+?)(?=\s+(?:et\s+payé|et\s+paye|payé|paye|par\s+moov|par\s+wave|par\s+t-money|par\s+orange|pour|à|en|\d+|$))",
            r"(?i)\b(?:pour\s+le\s+client|le\s+client)\s*:\s*([A-ZÀ-Ÿa-zà-ÿ0-9\s'-]+?)(?=\s+(?:et\s+payé|et\s+paye|payé|paye|par|pour|à|de|montant|\d+|$))",
            r"(?i)\bclient(?:e)?\s+([A-ZÀ-Ÿa-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿa-zà-ÿ0-9'-]+)*?)(?=\s+(?:et\s+payé|et\s+paye|payé|paye|par\s+|en\s+|\d+|$)|$)",
            r"(?i)\b(?:au\s+client|à\s+(?:m\.|mr\.|monsieur|mme|madame)|pour\s+(?:m\.|mr\.|monsieur|mme|madame))\s+([A-ZÀ-Ÿa-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿa-zà-ÿ0-9'-]+)*?)(?=\s+(?:et\s+payé|et\s+paye|payé|paye|par|pour|à|de|montant|en|\d+|$)|$)",
            r"(?i)\bpour\s+(?:le\s+client\s+)?([A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+)*?)(?=\s+(?:et\s+payé|et\s+paye|payé|paye|par\s+|en\s+|\d+|$)|$)",
        ]
        for pat in client_patterns:
            m = re.search(pat, text)
            if m:
                cand = m.group(1).strip()
                cand = re.sub(r"(?i)^(?:m\.|mr\.|monsieur|mme|madame|le\s+client)\s*", "", cand).strip()
                cand = re.sub(r"(?i)\s+et$", "", cand).strip()
                if len(cand) >= 2 and not bool(re.search(r"^\d", cand)) and cand.lower() not in ["moov", "moov money", "wave", "orange", "orange money", "mtn", "cfa", "euro", "virement", "espèces", "especes", "cash", "un", "une", "le", "la", "les"]:
                    return cand.title()
        return None

    def _parse_single_sale_segment(self, text: str, default_currency: str = "XOF") -> VoiceSaleCandidate:
        currency = self._extract_currency(text, default_currency)
        payment_method, payment_status = self._extract_payment_method(text)
        client_name = self._extract_client_name(text)

        cleaned = text.strip()

        # 1. Subject Client Extraction (e.g., "Sylvie a acheté 3 téléphones...")
        subject_match = re.search(
            r"(?i)^(?:pour\s+)?(?:le\s+client|la\s+cliente|m\.|mr\.|monsieur|mme|madame)?\s*([a-zA-ZÀ-ÿ\s'-]+?)\s+(?:a\s+(?:acheté|achete|pris|commandé|commande|payé|paye|réglé|regle|demandé|demande)|est\s+venu(?:e)?\s+(?:acheter|prendre)|nous\s+a\s+(?:acheté|commandé|pris))\s+(.+)$",
            cleaned,
        )
        if subject_match:
            cand_client = subject_match.group(1).strip()
            cand_client = re.sub(r"(?i)^(?:le\s+client|la\s+cliente|m\.|mr\.|monsieur|mme|madame)\s*", "", cand_client).strip()
            if len(cand_client) >= 2 and cand_client.lower() not in ["on", "nous", "j'ai", "je", "vente", "il", "elle", "j"]:
                client_name = cand_client.capitalize()
                cleaned = subject_match.group(2).strip()

        # 2. Clean introductory verbs
        intro_pattern = r"(?i)^(?:(?:veuillez\s+|peux-tu\s+|stp\s+|s\'il\s+te\s+plaît\s+)?(?:enregistre(?:\s+moi|\-moi)?|ajoute(?:\s+moi|\-moi)?|crée(?:\s+moi|\-moi)?|note(?:\s+moi|\-moi)?|fais(?:\s+moi|\-moi)?|saisis(?:\s+moi|\-moi)?)\s+)?(?:une\s+)?(?:vente\s+(?:de\s+la\s+|du\s+|des\s+|d\'un\s+|d\'une\s+|de\s+|d\')?|vendu\s+)?|(?:j\'ai\s+(?:fait\s+)?(?:effectuer\s+|effectué\s+)?(?:vendu\s+|une\s+vente\s+de\s+)?|j\'ai\s+vendu\s+|on\s+a\s+vendu\s+|nous\s+avons\s+vendu\s+)"
        cleaned = re.sub(intro_pattern, "", cleaned).strip()

        # 3. Convert spoken French number words
        word_numbers = {
            "deux": "2", "trois": "3", "quatre": "4",
            "cinq": "5", "six": "6", "sept": "7", "huit": "8", "neuf": "9",
            "dix": "10", "onze": "11", "douze": "12", "treize": "13", "quatorze": "14",
            "quinze": "15", "seize": "16", "vingt": "20", "trente": "30",
            "quarante": "40", "cinquante": "50", "soixante": "60", "cent": "100",
        }
        for word, num in word_numbers.items():
            cleaned = re.sub(rf"(?i)\b{word}\b(?=\s+[a-zA-ZÀ-ÿ])", num, cleaned)

        # 4. Extract primary quantity
        quantity = Decimal("1")
        un_match = re.match(r"(?i)^(?:un|une)\s+", cleaned)
        num_match = re.match(r"(?i)^(\d{1,4})\s+", cleaned)
        if un_match:
            quantity = Decimal("1")
            cleaned = cleaned[un_match.end():].strip()
        elif num_match:
            try:
                quantity = Decimal(num_match.group(1))
                cleaned = cleaned[num_match.end():].strip()
            except Exception:
                quantity = Decimal("1")

        # 5. Extract price & per-unit indicator
        is_per_unit = bool(re.search(
            r"(?i)\b(?:par\s+(?:unité|unite|pièce|piece|article|sac|carton|ordinateur|personne|heure|jour|mois|licence|boite|bouteille|exemplaire|kg|kilo|litre|produit)|l'unité|l'unite|chacun|la\s+pièce|la\s+piece|pièce|piece|l'une|un\s+carton|le\s+carton|le\s+sac|un\s+sac|l'article|le\s+produit)\b",
            text,
        ))
        has_a_price = bool(re.search(r"(?i)\b(?:à|a|au\s+prix\s+de)\s+\d+", text))
        if has_a_price:
            is_per_unit = True

        is_explicit_total = bool(re.search(r"(?i)\b(?:pour|montant\s+total\s+de|total\s+de)\s+\d+", text)) and not has_a_price

        price_match = re.search(r"(?i)(?:à|a|au\s+prix\s+de|pour|montant\s+de)\s+(\d+(?:[\s\.]\d{3})*(?:,\d+)?)\s*(?:f|fcfa|cfa|francs?|euros?|€)?", text)
        unit_price = Decimal("0")
        total_amount = Decimal("0")

        if price_match:
            p_val = Decimal(price_match.group(1).replace(" ", "").replace(".", "").replace(",", "."))
            if is_explicit_total:
                total_amount = p_val
                unit_price = total_amount / quantity
            elif is_per_unit:
                unit_price = p_val
                total_amount = quantity * unit_price
            else:
                total_amount = p_val
                unit_price = total_amount / quantity
        else:
            amounts = self._extract_amounts(text)
            if quantity in amounts and len(amounts) > 1:
                amounts = [a for a in amounts if a != quantity]
            if amounts:
                if is_per_unit and quantity > 1:
                    unit_price = amounts[0]
                    total_amount = quantity * unit_price
                elif len(amounts) >= 2 and quantity > 1:
                    unit_price = min(amounts)
                    total_amount = max(amounts)
                else:
                    total_amount = amounts[0]
                    unit_price = total_amount / quantity

        # 6. Extract Item label
        item_label = "Vente non détaillée"
        item_match = re.search(
            r"(?i)^([a-zA-ZÀ-ÿ\s\'-]+?)(?=\s+(?:à|a\s+\d+|au\s+prix|pour|montant|payé|paye|par|en|fcfa|cfa|francs?|\d+)|$)",
            cleaned,
        )
        if item_match:
            cand_item = item_match.group(1).strip()
            cand_item = re.sub(r"(?i)\b(?:cartons?|sacs?|pièces?|pieces?|bouteilles?|boites?)\s+de\s+", "", cand_item).strip()
            cand_item = re.sub(r"(?i)\s+(?:un|le)\s+(?:carton|sac|piece|article)$", "", cand_item).strip()
            if len(cand_item) >= 2:
                item_label = cand_item[0].upper() + cand_item[1:]

        ref_code = f"VOC-{date.today().strftime('%Y%m%d')}-{str(uuid4())[:4].upper()}"

        return VoiceSaleCandidate(
            reference=ref_code,
            sale_date=date.today(),
            client_name=client_name,
            item_label=item_label,
            quantity=quantity,
            unit_price=unit_price,
            discount=Decimal("0"),
            total_amount=total_amount,
            currency=currency,
            payment_method=payment_method,
            payment_status=payment_status,
            sales_channel="Capture Vocale",
            comment=f"Transcription vocale : \"{text}\"",
        )

    def _parse_sale(self, text: str, default_currency: str = "XOF") -> VoiceParseResponse:
        split_pattern = r"(?i)(?:\s*(?:;|\bet\s+aussi\b|\bnous\s+avons\s+aussi\s+(?:vendu\s+)?|\bon\s+a\s+aussi\s+vendu\b|\baussi\s+vendu\b|\bet\s+puis\b|\bdeuxième\s+vente\b|\b2e\s+vente\b|\bet\s+une\s+vente\s+de\b|\bainsi\s+que\s+la\s+vente\b|\bainsi\s+que\s+une\s+vente\b|\bplus\s+une\s+vente\b)\s*)"
        raw_segments = re.split(split_pattern, text)
        segments = [s.strip() for s in raw_segments if len(s.strip()) > 3]

        if len(segments) > 1:
            sales = [self._parse_single_sale_segment(s, default_currency) for s in segments]
        else:
            sales = [self._parse_single_sale_segment(text, default_currency)]

        primary_sale = sales[0]
        confidence = 0.95 if primary_sale.item_label != "Vente non détaillée" else 0.70

        if len(sales) > 1:
            summary = f"{len(sales)} ventes détectées : " + " ; ".join(
                [f"{s.quantity}x {s.item_label} ({s.total_amount} {s.currency})" for s in sales]
            )
        else:
            client_str = f" pour {primary_sale.client_name}" if primary_sale.client_name else ""
            summary = f"Vente de {primary_sale.quantity}x {primary_sale.item_label}{client_str} pour un total de {primary_sale.total_amount} {primary_sale.currency} ({primary_sale.payment_method or 'Non payé'})."

        return VoiceParseResponse(
            intent=VoiceIntent.SALE,
            confidence=confidence,
            original_transcript=text,
            sale=primary_sale,
            sales=sales,
            extracted_entities={
                "item_label": primary_sale.item_label,
                "quantity": str(primary_sale.quantity),
                "total_amount": str(primary_sale.total_amount),
                "currency": primary_sale.currency,
                "client_name": primary_sale.client_name or "Comptoir",
                "payment_method": primary_sale.payment_method or "Non spécifié",
                "sales_count": len(sales),
            },
            summary_message=summary,
        )

    def _parse_offer(self, text: str) -> VoiceParseResponse:
        amounts = self._extract_amounts(text)
        currency = self._extract_currency(text, "XOF")
        price = amounts[0] if amounts else None

        cleaned = re.sub(
            r"(?i)^(?:offre|tarif|créer\s+l'offre|nouveau\s+tarif|créer\s+un\s+service)\s+(?:sur\s+|de\s+|pour\s+)?",
            "",
            text.strip(),
        )
        cleaned = re.sub(r"(?i)\s+(?:à|au\s+prix\s+de|pour|montant)\s+.*$", "", cleaned).strip()
        name = cleaned[0].upper() + cleaned[1:] if cleaned else "Nouvelle Prestation"

        candidate = VoiceOfferCandidate(
            name=name,
            currency=currency,
            price=price,
            category="Services & Prestations",
            description=f"Offre générée par commande vocale : \"{text}\"",
        )

        return VoiceParseResponse(
            intent=VoiceIntent.OFFER,
            confidence=0.85 if price else 0.6,
            original_transcript=text,
            offer=candidate,
            extracted_entities={"name": name, "price": str(price) if price else "0", "currency": currency},
            summary_message=f"Offre « {name} » configurée au tarif de {price or 0} {currency}.",
        )

    def _parse_procedure(self, text: str) -> VoiceParseResponse:
        steps_raw = re.split(r"(?i)\s*(?:puis|ensuite|après|enfin|étape\s+\d+|et\s+alors)\s*", text)
        steps = []
        for i, s in enumerate(steps_raw):
            clean_s = s.strip()
            if len(clean_s) > 3:
                steps.append({"position": i + 1, "title": clean_s[0].upper() + clean_s[1:]})

        title_match = re.search(r"(?i)(?:procédure|processus|méthode)\s+(?:de\s+|pour\s+)?([^,;\.]+)", text)
        title = title_match.group(1).strip().capitalize() if title_match else "Procédure Opérationnelle"

        candidate = VoiceProcedureCandidate(
            title=title,
            steps=steps,
            category="Opérations Générales",
        )

        return VoiceParseResponse(
            intent=VoiceIntent.PROCEDURE,
            confidence=0.85,
            original_transcript=text,
            procedure=candidate,
            extracted_entities={"title": title, "steps_count": len(steps)},
            summary_message=f"Procédure « {title} » avec {len(steps)} étape(s) détectée(s).",
        )

    def _parse_expense(self, text: str) -> VoiceParseResponse:
        amounts = self._extract_amounts(text)
        currency = self._extract_currency(text, "XOF")
        payment_method, payment_status = self._extract_payment_method(text)
        if payment_status == PaymentStatus.UNPAID and payment_method:
            payment_status = PaymentStatus.PAID

        lower = text.lower()
        category = "Charges d'exploitation"
        if any(w in lower for w in ["carburant", "essence", "gasoil", "déplacement", "deplacement", "transport", "taxi"]):
            category = "Carburant & Déplacements"
        elif any(w in lower for w in ["fournitures", "bureau", "papier", "rame", "stylos", "encre"]):
            category = "Fournitures & Petit Matériel"
        elif any(w in lower for w in ["loyer", "bail", "local"]):
            category = "Loyer & Charges Locatives"
        elif any(w in lower for w in ["électricité", "electricite", "eau", "cie", "sodeci", "internet", "connexion"]):
            category = "Fluides & Télécoms"
        elif any(w in lower for w in ["salaire", "prime", "avance sur salaire", "paie"]):
            category = "Rémunérations & Salaires"
        elif any(w in lower for w in ["maintenance", "réparation", "reparation", "entretien"]):
            category = "Entretien & Réparations"

        amount = amounts[0] if amounts else Decimal("0.00")
        today = date.today()
        ref = f"DEP-{today.strftime('%Y%m%d')}-{uuid4().hex[:4].upper()}"

        clean_desc = re.sub(r"(?i)^(?:dépense|depense|dépenses|depenses|achat|frais|décaissement|paiement)\s+(?:de\s+)?", "", text.strip())
        clean_desc = clean_desc[0].upper() + clean_desc[1:] if clean_desc else "Dépense d'exploitation"

        candidate = VoiceExpenseCandidate(
            reference=ref,
            expense_date=today,
            beneficiary=clean_desc if clean_desc else "Fournisseur / Frais d'exploitation",
            category=category,
            amount=amount,
            currency=currency,
            payment_method=payment_method or "Espèces",
            payment_status=PaymentStatus.PAID,
            comment="Enregistré par passerelle vocale / WhatsApp",
        )

        return VoiceParseResponse(
            intent=VoiceIntent.EXPENSE,
            confidence=0.95 if amount > 0 else 0.6,
            original_transcript=text,
            expense=candidate,
            expenses=[candidate],
            extracted_entities={
                "amount": str(amount),
                "category": category,
                "currency": currency,
                "payment_method": payment_method or "Espèces",
            },
            summary_message=f"Dépense de {amount:,.0f} {currency} pour {category} détectée.",
        )

    async def confirm_record(
        self,
        s: AsyncSession,
        org_id: str,
        user_id: str,
        request: VoiceConfirmRequest,
    ) -> dict[str, Any]:
        from app.models.organization import Organization
        from app.models.user import User

        org = await s.get(Organization, org_id)
        user = await s.get(User, user_id)
        if not org or not user:
            raise ApplicationError("not_found", "Organisation ou utilisateur introuvable", 404)

        if request.intent == VoiceIntent.SALE:
            payload = request.payload
            if isinstance(payload, list):
                created_sales = []
                for item in payload:
                    data = SaleCreate.model_validate(item)
                    sale = await self.register_service.create_sale(
                        s, org, user, data, source=RecordSource.VOICE
                    )
                    created_sales.append(sale.id)
                return {"type": "sales", "count": len(created_sales), "ids": created_sales}
            else:
                data = SaleCreate.model_validate(payload)
                sale = await self.register_service.create_sale(
                    s, org, user, data, source=RecordSource.VOICE
                )
                return {"type": "sale", "id": sale.id, "reference": sale.reference}
        elif request.intent == VoiceIntent.EXPENSE:
            data = ExpenseCreate.model_validate(request.payload)
            expense = await self.register_service.create_expense(
                s, org, user, data, source=RecordSource.VOICE
            )
            return {"type": "expense", "id": expense.id, "reference": expense.reference}
        elif request.intent == VoiceIntent.OFFER:
            data = OfferCreate.model_validate(request.payload)
            offer = await self.register_service.create_offer(s, org, user, data)
            return {"type": "offer", "id": offer.id, "name": offer.name}
        elif request.intent == VoiceIntent.PROCEDURE:
            data = ProcedureCreate.model_validate(request.payload)
            created = await self.register_service.create_procedure(s, org, user, data)
            return {"type": "procedure", "id": created.id, "title": created.title}
        else:
            raise ApplicationError("invalid_intent", "Type de registre non supporté", 400)

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        content_type: str = "audio/webm",
    ) -> VoiceTranscriptionResponse:
        from app.core.config import get_settings
        from app.schemas.voice import VoiceTranscriptionResponse

        settings = get_settings()

        if not audio_bytes or len(audio_bytes) < 10:
            raise ApplicationError("empty_audio", "Le fichier audio est vide", 400)

        # Try Whisper via Knowlia / AI Gateway
        try:
            import httpx

            files = {"file": (filename, audio_bytes, content_type)}
            async with httpx.AsyncClient(
                base_url=settings.knowlia_base_url.rstrip("/"), timeout=30.0
            ) as client:
                res = await client.post("/api/v1/voice/transcribe", files=files)
                if res.status_code == 200:
                    data = res.json()
                    transcript = data.get("transcript") or data.get("text") or ""
                    if transcript:
                        return VoiceTranscriptionResponse(
                            transcript=clean_speech_duplicates(transcript.strip()),
                            confidence=float(data.get("confidence", 0.96)),
                            engine="Whisper AI HD (Knowlia Engine)",
                        )
        except Exception:
            pass

        raise ApplicationError(
            "transcription_unavailable",
            "La transcription audio n'a pas pu être traitée par le serveur Whisper. Veuillez utiliser la dictée directe ou saisir le texte.",
            503,
        )
'''

with open(backend_service_path, "w", encoding="utf-8") as f:
    f.write(backend_voice_content)
print("Updated backend/app/services/voice.py")

# 2. Update frontend/components/app/VoiceCaptureModal.tsx
frontend_voice_content = '''"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Pencil,
  RotateCcw,
  Check,
  Layers,
  Volume2,
  Smartphone,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { formatMoney, formatLabel, formatDate } from "./RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";

const CURRENCY_OPTIONS = [
  { code: "XOF", label: "XOF - Franc CFA (UEMOA)" },
  { code: "XAF", label: "XAF - Franc CFA (CEMAC)" },
  { code: "GNF", label: "GNF - Franc Guinéen" },
  { code: "CDF", label: "CDF - Franc Congolais" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "USD", label: "USD - Dollar US ($)" },
  { code: "MAD", label: "MAD - Dirham Marocain" },
  { code: "CAD", label: "CAD - Dollar Canadien" },
  { code: "GBP", label: "GBP - Livre Sterling (£)" },
  { code: "CHF", label: "CHF - Franc Suisse" },
  { code: "NGN", label: "NGN - Naira Nigérian" },
  { code: "GHS", label: "GHS - Cedi Ghanéen" },
  { code: "KES", label: "KES - Shilling Kenyan" },
  { code: "TND", label: "TND - Dinar Tunisien" },
  { code: "RWF", label: "RWF - Franc Rwandais" },
];

export interface VoiceSaleItem {
  reference: string;
  sale_date: string;
  client_name?: string | null;
  item_label: string;
  quantity: string | number;
  unit_price: string | number;
  total_amount: string | number;
  currency: string;
  payment_method?: string | null;
  payment_status: string;
  sales_channel?: string | null;
  comment?: string | null;
}

interface VoiceParseResult {
  intent: "sale" | "offer" | "procedure" | "expense" | "unknown";
  confidence: number;
  original_transcript: string;
  sale?: VoiceSaleItem;
  sales?: VoiceSaleItem[];
  offer?: {
    name: string;
    price?: string | number | null;
    currency: string;
    category?: string | null;
  };
  procedure?: {
    title: string;
    steps: Array<{ position: number; title: string }>;
  };
  summary_message: string;
}

interface VoiceCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function cleanSpeechDuplicates(text: string): string {
  if (!text) return "";
  let t = text.trim();
  for (let i = 0; i < 3; i++) {
    t = t.replace(/\\b(.+?)\\s+\\1\\b/gi, "$1");
  }
  t = t.replace(/\\b(\\w+)\\s+\\1\\b/gi, "$1");
  return t.replace(/\\s+/g, " ").trim();
}

export function VoiceCaptureModal({ open, onClose, onSuccess }: VoiceCaptureModalProps) {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [salesList, setSalesList] = useState<VoiceSaleItem[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingTranscript, setEditingTranscript] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptBufferRef = useRef<string>("");
  const finalSegmentsRef = useRef<string[]>([]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    setError("");
    setSuccessMessage("");
    setParseResult(null);
    setSalesList([]);
    setTranscript("");
    transcriptBufferRef.current = "";
    finalSegmentsRef.current = [];

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("La dictée vocale en direct n'est pas supportée par ce navigateur. Vous pouvez saisir votre phrase manuellement.");
      setEditingTranscript(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            const finalChunk = item[0]?.transcript?.trim();
            if (finalChunk && !finalSegmentsRef.current.includes(finalChunk)) {
              finalSegmentsRef.current.push(finalChunk);
            }
          } else {
            interimText += (item[0]?.transcript || "") + " ";
          }
        }

        const combined = [...finalSegmentsRef.current, interimText.trim()]
          .filter(Boolean)
          .join(" ");
        const cleaned = cleanSpeechDuplicates(combined);
        transcriptBufferRef.current = cleaned;
        setTranscript(cleaned);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error);
        if (event.error === "not-allowed") {
          setError("Accès au micro refusé. Veuillez autoriser l'accès micro dans les paramètres du navigateur.");
        } else if (event.error === "network") {
          setError("Problème réseau lors de la reconnaissance vocale. Vous pouvez corriger ou saisir le texte.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        const finalText = cleanSpeechDuplicates(transcriptBufferRef.current.trim());
        if (finalText) {
          setTranscript(finalText);
          void parseTranscriptText(finalText);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Recognition start error:", err);
      setError("Impossible de démarrer la capture audio. Vous pouvez saisir le texte.");
      setEditingTranscript(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const parseTranscriptText = async (textToParse: string) => {
    const cleanText = cleanSpeechDuplicates(textToParse.trim());
    if (!cleanText) return;
    setAnalyzing(true);
    setError("");

    try {
      const result = await serviceIaFetch<VoiceParseResult>("/voice/parse", {
        method: "POST",
        body: JSON.stringify({ transcript: cleanText }),
      });
      setParseResult(result);
      if (result.sales && result.sales.length > 0) {
        setSalesList(result.sales);
      } else if (result.sale) {
        setSalesList([result.sale]);
      } else {
        setSalesList([]);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse sémantique du texte.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateSale = (index: number, field: keyof VoiceSaleItem, value: any) => {
    setSalesList((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        const q = Number(field === "quantity" ? value : target.quantity) || 1;
        const p = Number(field === "unit_price" ? value : target.unit_price) || 0;
        target.total_amount = q * p;
      }
      if (field === "total_amount") {
        const q = Number(target.quantity) || 1;
        const t = Number(value) || 0;
        target.unit_price = q > 0 ? t / q : t;
      }

      copy[index] = target;
      return copy;
    });
  };

  const confirmRecord = async () => {
    if (!parseResult || parseResult.intent === "unknown") return;
    setSaving(true);
    setError("");

    try {
      let payload: any = null;
      if (parseResult.intent === "sale") {
        payload = salesList.length > 1 ? salesList : salesList[0] || parseResult.sale;
      } else if (parseResult.intent === "offer" && parseResult.offer) {
        payload = parseResult.offer;
      } else if (parseResult.intent === "procedure" && parseResult.procedure) {
        payload = parseResult.procedure;
      }

      await serviceIaFetch("/voice/confirm", {
        method: "POST",
        body: JSON.stringify({
          intent: parseResult.intent,
          payload: payload,
          source: "voice",
        }),
      });

      const countMsg = salesList.length > 1 ? `${salesList.length} ventes enregistrées` : "Vente enregistrée";
      setSuccessMessage(`${countMsg} avec succès dans votre Registre !`);
      onSuccess();
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la validation finale du registre.");
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    if (isRecording) stopRecording();
    setTranscript("");
    setParseResult(null);
    setSalesList([]);
    setError("");
    setSuccessMessage("");
    setEditingTranscript(false);
    setRecordingSeconds(0);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isRecording) stopRecording();
        onClose();
        resetModal();
      }}
      title="Dictée Vocale Intelligente de Vente"
      description="Dictez naturellement vos ventes sur smartphone ou PC. L'IA extrait automatiquement l'article, le client, la quantité, le prix unitaire et le paiement."
    >
      <div className="space-y-4">
        {/* Recording Visualizer Card */}
        <div className="p-6 rounded-3xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center relative overflow-hidden">
          {isRecording && (
            <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />
          )}

          <div className="mb-3 relative">
            {isRecording && (
              <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={analyzing || saving}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-8 ring-rose-500/30"
                  : "bg-primary hover:opacity-90 text-primary-foreground active:scale-95"
              }`}
            >
              {isRecording ? <Square size={28} /> : <Mic size={32} />}
            </button>
          </div>

          <div>
            <span className="font-mono text-xl font-black text-foreground block">
              {isRecording ? formatTimer(recordingSeconds) : "Microphone prêt"}
            </span>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isRecording
                ? "Parlez naturellement… Cliquez sur le carré rouge pour analyser."
                : "Appuyez sur le micro et dictez : « Vente de 10 cartons de biscuit à 2000f payé par Moov Money client Koffi »."}
            </p>
          </div>
        </div>

        {/* Live Audio / Transcribed Text Review */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Radio size={14} className={isRecording ? "text-rose-600 animate-pulse" : "text-emerald-600"} />
              <span>{isRecording ? "Capture vocale en direct…" : "Texte dicté"}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingTranscript((prev) => !prev)}
              className="text-primary hover:underline text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              <Pencil size={12} />
              <span>{editingTranscript ? "Masquer l'éditeur" : "Corriger le texte"}</span>
            </button>
          </div>

          {editingTranscript ? (
            <div className="space-y-2">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Exemple : Vente de 10 cartons de biscuit à 2000f un carton payé par Moov Money par le client Koffi"
                rows={3}
                className="w-full p-3 rounded-2xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => parseTranscriptText(transcript)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition cursor-pointer"
              >
                Analyser et extraire
              </button>
            </div>
          ) : (
            <p className="p-3.5 rounded-2xl bg-card border border-border text-sm text-foreground italic leading-relaxed min-h-[44px]">
              {transcript ? `« ${transcript} »` : <span className="text-muted-foreground not-italic">Appuyez sur le micro pour dicter votre vente.</span>}
            </p>
          )}
        </div>

        {/* Status indicator */}
        {analyzing && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center gap-2">
            <RotateCcw size={15} className="animate-spin" />
            <span>Extraction IA intelligente des articles, prix et clients…</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Extracted Structured Card */}
        {parseResult && parseResult.intent !== "unknown" && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <strong className="text-xs uppercase font-bold tracking-wider text-foreground">
                  {parseResult.intent === "sale" && salesList.length > 1
                    ? `✨ ${salesList.length} Ventes Détectées`
                    : `✨ Vente Détectée`}
                </strong>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatDate(new Date().toISOString(), true)}
              </span>
            </div>

            {/* Multiple Sales / Single Sale Preview */}
            {parseResult.intent === "sale" && salesList.length > 0 && (
              <div className="space-y-3">
                {salesList.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2.5 shadow-sm">
                    {salesList.length > 1 && (
                      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Layers size={13} />
                          <span>Vente #{idx + 1}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Réf : {item.reference}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Article / Produit</span>
                        <input
                          type="text"
                          value={item.item_label}
                          onChange={(e) => handleUpdateSale(idx, "item_label", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Client</span>
                        <input
                          type="text"
                          value={item.client_name || ""}
                          placeholder="Client comptoir"
                          onChange={(e) => handleUpdateSale(idx, "client_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Quantité</span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSale(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Montant Total</span>
                        <input
                          type="number"
                          step="any"
                          value={item.total_amount}
                          onChange={(e) => handleUpdateSale(idx, "total_amount", e.target.value)}
                          placeholder="Prix total"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-bold font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Devise</span>
                        <select
                          value={item.currency}
                          onChange={(e) => handleUpdateSale(idx, "currency", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Mode de Paiement</span>
                        <input
                          type="text"
                          value={item.payment_method || "Espèces"}
                          onChange={(e) => handleUpdateSale(idx, "payment_method", e.target.value)}
                          placeholder="Moov Money, Wave, etc."
                          className="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Payment status toggle per sale */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground text-[10px] font-bold uppercase">Statut Règlement :</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "unpaid")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            item.payment_status === "unpaid"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          ⏳ Non Payé
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "paid")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            item.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          🟢 Payé
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
              resetModal();
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            Fermer
          </button>

          {parseResult && parseResult.intent !== "unknown" && (
            <button
              type="button"
              onClick={confirmRecord}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>
                {saving
                  ? "Validation..."
                  : parseResult.intent === "sale" && salesList.length > 1
                  ? `Enregistrer les ${salesList.length} ventes`
                  : "Enregistrer la vente"}
              </span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
'''

with open(frontend_modal_path, "w", encoding="utf-8") as f:
    f.write(frontend_voice_content)
print("Updated frontend/components/app/VoiceCaptureModal.tsx")
'''

with open(r"C:\Users\DELL WORKSTATION\.gemini\antigravity\brain\5dcb185f-2006-4070-8368-f7b093cea6f9\scratch\update_voice_system.py", "w", encoding="utf-8") as f:
    f.write(backend_voice_content)
