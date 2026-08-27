from __future__ import annotations

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
            t = re.sub(rf"\b{w}\b", num_str, t)

        t = re.sub(r"\b(\d+)\s*(?:mille|k)\b", lambda m: str(int(m.group(1)) * 1000), t)
        normalized = re.sub(r"(?i)\b(fcfa|cfa|francs?|f|euros?|€|dollars?|\$)\b", "", t)
        matches = re.findall(r"\b\d+(?:[\s\.]\d{3})*(?:,\d+)?\b|\b\d+(?:,\d+)?\b", normalized)
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
        if re.search(r"(?i)\b(?:euros?|eur|€)\b", text):
            return "EUR"
        if re.search(r"(?i)\b(?:dollars?|usd|\$|cad)\b", text):
            return "USD"
        if re.search(r"(?i)\b(?:livres?|gbp|£)\b", text):
            return "GBP"
        if re.search(r"(?i)\b(?:dirhams?|mad|dhs?)\b", text):
            return "MAD"
        if re.search(r"(?i)\b(?:dinars?|tnd|dzd)\b", text):
            return "TND"
        if re.search(r"(?i)\b(?:nairas?|ngn|₦)\b", text):
            return "NGN"
        if re.search(r"(?i)\b(?:cedis?|ghs|₵)\b", text):
            return "GHS"
        if re.search(r"(?i)\b(?:shillings?|kes)\b", text):
            return "KES"
        if re.search(r"(?i)\b(?:guinéens?|guineens?|gnf)\b", text):
            return "GNF"
        if re.search(r"(?i)\b(?:congolais|cdf)\b", text):
            return "CDF"
        if re.search(r"(?i)\b(?:rwandais|rwf)\b", text):
            return "RWF"
        if re.search(r"(?i)\b(?:ariary|mga)\b", text):
            return "MGA"
        if re.search(r"(?i)\b(?:cemac|xaf)\b", text):
            return "XAF"
        if re.search(r"(?i)\b(?:cfa|fcfa|f cfa|uemoa|xof)\b", text):
            return "XOF"
        if re.search(r"(?i)\b(?:francs?|f)\b", text):
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
            if any(re.search(rf"\b{re.escape(alias)}\b", lower) for alias in aliases):
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
                num_val = Decimal(num_match.group(1))
                if num_val >= 100 and not re.search(r"(?i)\b(?:à|au\s+prix\s+de|pour)\s+\d+", text):
                    quantity = Decimal("1")
                else:
                    quantity = num_val
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
                "amount": str(primary_sale.total_amount),
                "total_amount": str(primary_sale.total_amount),
                "currency": primary_sale.currency,
                "client": primary_sale.client_name or "Comptoir",
                "client_name": primary_sale.client_name or "Comptoir",
                "payment_method": primary_sale.payment_method or "Non spécifié",
                "payment_status": primary_sale.payment_status.value if hasattr(primary_sale.payment_status, "value") else str(primary_sale.payment_status),
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
        if request.intent == VoiceIntent.SALE:
            payload = request.payload
            if isinstance(payload, list):
                created_sales = []
                for item in payload:
                    data = SaleCreate.model_validate(item)
                    sale = await self.register_service.create_sale(
                        s, org_id, user_id, data, source=RecordSource.VOICE
                    )
                    created_sales.append(sale.id)
                return {"type": "sales_batch", "count": len(created_sales), "ids": created_sales}
            else:
                data = SaleCreate.model_validate(payload)
                sale = await self.register_service.create_sale(
                    s, org_id, user_id, data, source=RecordSource.VOICE
                )
                return {"type": "sale", "id": sale.id, "reference": sale.reference, "item_label": sale.item_label}
        elif request.intent == VoiceIntent.EXPENSE:
            data = ExpenseCreate.model_validate(request.payload)
            expense = await self.register_service.create_expense(
                s, org_id, user_id, data, source=RecordSource.VOICE
            )
            return {"type": "expense", "id": expense.id, "reference": expense.reference}
        elif request.intent == VoiceIntent.OFFER:
            data = OfferCreate.model_validate(request.payload)
            offer = await self.register_service.create_offer(s, org_id, user_id, data)
            return {"type": "offer", "id": offer.id, "name": offer.name}
        elif request.intent == VoiceIntent.PROCEDURE:
            data = ProcedureCreate.model_validate(request.payload)
            created = await self.register_service.create_procedure(s, org_id, user_id, data)
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
