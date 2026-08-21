from __future__ import annotations

import re
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ApplicationError
from app.models.registers import PaymentStatus, RecordSource
from app.schemas.registers import OfferCreate, ProcedureCreate, SaleCreate, StepInput
from app.schemas.voice import (
    VoiceConfirmRequest,
    VoiceIntent,
    VoiceOfferCandidate,
    VoiceParseRequest,
    VoiceParseResponse,
    VoiceProcedureCandidate,
    VoiceSaleCandidate,
)
from app.services.registers import RegisterService


class VoiceService:
    def __init__(self, register_service: RegisterService | None = None) -> None:
        self.register_service = register_service or RegisterService()

    def parse_transcript(self, request: VoiceParseRequest) -> VoiceParseResponse:
        text = request.transcript.strip()
        lower = text.lower()

        # Determine Intent
        intent = VoiceIntent.UNKNOWN
        if any(w in lower for w in ["vente", "vendu", "encaissé", "facturé", "achat client", "vends"]):
            intent = VoiceIntent.SALE
        elif any(w in lower for w in ["procédure", "processus", "méthode", "étapes", "consigne", "protocole"]):
            intent = VoiceIntent.PROCEDURE
        elif any(w in lower for w in ["offre", "tarif", "prix officiel", "prestation", "catalogue"]):
            intent = VoiceIntent.OFFER
        else:
            # Default heuristics: if numbers and client/product mentioned, assume sale
            if re.search(r"\b\d+[\s\d]*\b", text):
                intent = VoiceIntent.SALE

        if intent == VoiceIntent.SALE:
            return self._parse_sale(text)
        elif intent == VoiceIntent.PROCEDURE:
            return self._parse_procedure(text)
        elif intent == VoiceIntent.OFFER:
            return self._parse_offer(text)

        return VoiceParseResponse(
            intent=VoiceIntent.UNKNOWN,
            confidence=0.2,
            original_transcript=text,
            summary_message="Impossible de déterminer précisément s'il s'agit d'une vente, d'une offre ou d'une procédure.",
        )

    def _extract_amounts(self, text: str) -> list[Decimal]:
        # Handle word numbers in French (mille, etc.)
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

        # Handle (\d+)\s*(?:mille|k)\b -> e.g. "18 mille" or "18k" -> "18000"
        t = re.sub(r"\b(\d+)\s*(?:mille|k)\b", lambda m: str(int(m.group(1)) * 1000), t)

        # Clean currency words and extract numbers
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
        methods = {
            "wave": "Wave",
            "orange money": "Orange Money",
            "om": "Orange Money",
            "mtn": "MTN MoMo",
            "momo": "MTN MoMo",
            "moov": "Moov Money",
            "espèces": "Espèces",
            "espece": "Espèces",
            "cash": "Espèces",
            "chèque": "Chèque",
            "cheque": "Chèque",
            "virement": "Virement bancaire",
            "carte": "Carte bancaire",
        }
        detected_method = None
        for key, name in methods.items():
            if key in lower:
                detected_method = name
                break

        # Explicit status checks
        if any(w in lower for w in ["non payé", "non payee", "non paye", "impayé", "impayee", "impaye", "à crédit", "a credit", "crédit", "credit", "reste à payer", "en attente"]):
            status = PaymentStatus.UNPAID
        elif any(w in lower for w in ["partiel", "partielle", "acompte", "avance", "partiellement"]):
            status = PaymentStatus.PARTIAL
        elif any(w in lower for w in ["payé", "payee", "paye", "encaissé", "encaissee", "encaisse", "réglé", "regle", "soldé", "solde"]):
            status = PaymentStatus.PAID
        elif detected_method and any(w in lower for w in ["par", "en", "via", "reçu"]):
            status = PaymentStatus.PAID
        else:
            # Default is UNPAID (never assume paid without explicit indication)
            status = PaymentStatus.UNPAID

        return detected_method, status

    def _extract_client_name(self, text: str) -> str | None:
        # Patterns matching: pour le client M. Koffi, client: Société Alpha, client Société Alpha, à M. Diallo, pour M. Touré
        patterns = [
            r"(?i)\b(?:pour\s+le\s+client|le\s+client|client(?:e)?)\s*:\s*([A-ZÀ-Ÿa-zà-ÿ0-9\s'-]+?)(?=\s+(?:pour|à|de|montant|payé|par|\d+|$))",
            r"(?i)\b(?:pour\s+le\s+client|le\s+client|client(?:e)?)\s+(?:m\.|mr\.|monsieur|mme|madame)?\s*([A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+)*?)(?=\s+(?:pour|à|de|montant|payé|par|en|\d+|$))",
            r"(?i)\b(?:à|pour|chez)\s+(?:m\.|mr\.|monsieur|mme|madame)\s*([A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+)*?)(?=\s+(?:pour|à|de|montant|payé|par|en|\d+|$))",
            r"(?i)\bclient(?:e)?\s+([A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+)*?)(?=\s+(?:pour|à|de|montant|payé|par|en|\d+|$))",
            r"(?i)\b(?:à|pour|chez)\s+([A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ0-9'-]+)*?)(?=\s+(?:pour|à|de|montant|payé|par|en|\d+|$))",
        ]
        for pat in patterns:
            match = re.search(pat, text)
            if match:
                candidate = match.group(1).strip()
                candidate = re.sub(r"(?i)^(?:m\.|mr\.|monsieur|mme|madame|le\s+client)\s*", "", candidate).strip()
                if len(candidate) >= 2 and candidate.lower() not in ["wave", "orange", "mtn", "cfa", "euro", "virement", "espèces"]:
                    return candidate
        return None

    def _parse_single_sale_segment(self, text: str, default_currency: str = "XOF") -> VoiceSaleCandidate:
        amounts = self._extract_amounts(text)
        currency = self._extract_currency(text, default_currency)
        payment_method, payment_status = self._extract_payment_method(text)
        client_name = self._extract_client_name(text)

        working_text = text.strip()

        # 1. Subject Client Extraction (e.g., "Sylvie a acheté 3 téléphones...", "M. Koffi a pris...", "Client Diallo a commandé...")
        subject_match = re.search(
            r"(?i)^(?:pour\s+)?(?:le\s+client|la\s+cliente|m\.|mr\.|monsieur|mme|madame)?\s*([a-zA-ZÀ-ÿ\s'-]+?)\s+(?:a\s+(?:acheté|achete|pris|commandé|commande|payé|paye|réglé|regle|demandé|demande)|est\s+venu(?:e)?\s+(?:acheter|prendre)|nous\s+a\s+(?:acheté|commandé|pris))\s+(.+)$",
            working_text,
        )
        if subject_match:
            cand_client = subject_match.group(1).strip()
            cand_client = re.sub(r"(?i)^(?:le\s+client|la\s+cliente|m\.|mr\.|monsieur|mme|madame)\s*", "", cand_client).strip()
            if len(cand_client) >= 2 and cand_client.lower() not in ["on", "nous", "j'ai", "je", "vente", "il", "elle", "j"]:
                client_name = cand_client.capitalize()
                working_text = subject_match.group(2).strip()

        # 2. Clean introductory verbs BEFORE number word replacements
        cleaned = re.sub(
            r"(?i)^(?:j\'ai\s+(?:fait\s+)?(?:effectuer\s+|effectué\s+)?|nous\s+avons\s+(?:vendu\s+)?|on\s+a\s+(?:vendu\s+)?|veuillez\s+enregistrer\s+)?(?:une\s+)?(?:vente\s+(?:de\s+la\s+|du\s+|des\s+|d\'un\s+|d\'une\s+|de\s+|d\')?|vendu\s+)",
            "",
            working_text,
        ).strip()

        # 3. Convert spoken French number words to digits before nouns
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
        num_match = re.match(r"(?i)^(\d{1,3})\s+(sacs?|cartons?|articles?|unités?|pièces?|boites?|heures?|jours?|ordinateurs?|produits?|exemplaires?|livres?|bouteilles?|packs?|[a-zA-ZÀ-ÿ\'-]+)", cleaned)

        if un_match:
            quantity = Decimal("1")
            cleaned = cleaned[un_match.end():].strip()
        elif num_match:
            try:
                quantity = Decimal(num_match.group(1))
                cleaned = cleaned[len(num_match.group(1)):].strip()
            except Exception:
                quantity = Decimal("1")

        # 5. Extract Item label
        item_label = "Vente non détaillée"
        item_match = re.search(
            r"(?i)^([a-zA-ZÀ-ÿ\s\'-]+?)(?=\s+(?:à|au\s+prix|pour|montant|payé|en|fcfa|cfa|francs?|\d+)|$)",
            cleaned,
        )
        if item_match:
            cand = item_match.group(1).strip()
            cand = re.sub(r"(?i)^(?:pièces?\s+de|pieces?\s+de|articles?\s+de|unités?\s+de|unites?\s+de)\s+", "", cand).strip()
            stopwords = {
                "non", "non paye", "non payes", "non payee", "non payees",
                "paye", "payes", "payee", "payees", "impaye", "impayee",
                "partiel", "partielle", "credit", "a credit", "de", "d", "la", "le", "les",
            }
            if len(cand) >= 2 and cand.lower() not in stopwords and not bool(re.search(r"\d", cand)):
                item_label = cand

        # Exclude extracted quantity number from monetary amounts list
        if quantity in amounts and len(amounts) > 1:
            amounts = [a for a in amounts if a != quantity]

        # 6. Per-unit price vs Total calculation
        is_per_unit = bool(re.search(
            r"(?i)\b(?:par\s+(?:unité|unite|pièce|piece|article|sac|carton|ordinateur|personne|heure|jour|mois|licence|boite|bouteille|exemplaire|kg|kilo|litre|produit)|l'unité|l'unite|chacun|la\s+pièce|la\s+piece|l'une|par\s+tête)\b",
            text,
        ))

        total_amount = Decimal("0")
        unit_price = Decimal("0")

        # Check explicit price pattern
        price_match = re.search(r"(?i)(?:à|au\s+prix\s+de|pour|montant\s+de)\s+(\d+(?:[\s\.]\d{3})*(?:,\d+)?)", text)
        if price_match:
            clean_p = price_match.group(1).replace(" ", "").replace(".", "").replace(",", ".")
            try:
                detected_price = Decimal(clean_p)
                if is_per_unit:
                    unit_price = detected_price
                    total_amount = quantity * unit_price
                else:
                    total_amount = detected_price
                    unit_price = total_amount / quantity
            except Exception:
                pass
        elif amounts:
            if is_per_unit and quantity > 1:
                unit_price = amounts[0]
                total_amount = quantity * unit_price
            elif len(amounts) >= 2 and quantity > 1:
                unit_price = min(amounts)
                total_amount = max(amounts)
            else:
                total_amount = amounts[0]
                unit_price = total_amount / quantity

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
        # Multi-sale segmentation (split on explicit conjunctions, avoiding periods in abbreviations like M. or prices)
        split_pattern = r"(?i)(?:\s*(?:;|\bet\s+aussi\b|\bnous\s+avons\s+aussi\s+(?:vendu\s+)?|\bon\s+a\s+aussi\s+vendu\b|\baussi\s+vendu\b|\bet\s+puis\b|\bdeuxième\s+vente\b|\b2e\s+vente\b|\bet\s+une\s+vente\s+de\b|\bainsi\s+que\s+la\s+vente\b|\bainsi\s+que\s+une\s+vente\b|\bplus\s+une\s+vente\b)\s*)"
        raw_segments = re.split(split_pattern, text)
        segments = [s.strip() for s in raw_segments if len(s.strip()) > 3]

        if len(segments) > 1:
            sales = [self._parse_single_sale_segment(s, default_currency) for s in segments]
        else:
            sales = [self._parse_single_sale_segment(text, default_currency)]

        primary_sale = sales[0]
        confidence = 0.90 if primary_sale.item_label != "Vente non détaillée" else 0.70

        if len(sales) > 1:
            summary = f"{len(sales)} ventes détectées : " + " ; ".join(
                [f"{s.quantity}x {s.item_label} ({s.total_amount} {s.currency})" for s in sales]
            )
        else:
            payment_label = {
                PaymentStatus.PAID: "payée",
                PaymentStatus.UNPAID: "non payée",
                PaymentStatus.PARTIAL: "partiellement payée",
                PaymentStatus.REFUNDED: "remboursée",
            }.get(primary_sale.payment_status, str(primary_sale.payment_status))
            summary = f"{primary_sale.item_label} — total de {primary_sale.total_amount} {primary_sale.currency}, {payment_label}, client : {primary_sale.client_name or 'non renseigné'}."

        return VoiceParseResponse(
            intent=VoiceIntent.SALE,
            confidence=confidence,
            original_transcript=text,
            sale=primary_sale,
            sales=sales,
            extracted_entities={
                "client": primary_sale.client_name,
                "amount": str(primary_sale.total_amount),
                "unit_price": str(primary_sale.unit_price),
                "quantity": str(primary_sale.quantity),
                "currency": primary_sale.currency,
                "payment_method": primary_sale.payment_method,
                "payment_status": primary_sale.payment_status,
                "item": primary_sale.item_label,
                "sales_count": len(sales),
            },
            summary_message=summary,
        )

    def _parse_offer(self, text: str) -> VoiceParseResponse:
        amounts = self._extract_amounts(text)
        currency = self._extract_currency(text)
        price = amounts[0] if amounts else None

        name = "Nouvelle offre"
        name_match = re.search(r"(?i)(?:offre|tarif|pack|prestation)\s*:\s*([^\d,;]+)|(?:offre|pack)\s+([^\d,;]+)", text)
        if name_match:
            name = (name_match.group(1) or name_match.group(2) or "Nouvelle offre").strip()

        candidate = VoiceOfferCandidate(
            name=name,
            price=price,
            currency=currency,
            conditions=f"Extrait par capture vocale : {text}",
        )

        return VoiceParseResponse(
            intent=VoiceIntent.OFFER,
            confidence=0.75 if price else 0.50,
            original_transcript=text,
            offer=candidate,
            extracted_entities={"name": name, "price": str(price) if price else None, "currency": currency},
            summary_message=f"Offre « {name} » au tarif de {price or 'Sur devis'} {currency}.",
        )

    def _parse_procedure(self, text: str) -> VoiceParseResponse:
        title = "Procédure d'exploitation"
        title_match = re.search(r"(?i)(?:procédure\s+(?:de|pour|d')?|processus\s+(?:de|pour|d')?)(.+?)(?=\s*:\s*|\s+étape|\s+premièrement|$)", text)
        if title_match:
            title = f"Procédure : {title_match.group(1).strip()}"

        # Extract steps
        raw_steps = re.split(r"(?i)\b(?:étape\s*\d+|premièrement|deuxièmement|troisièmement|puis|ensuite|enfin)\s*[:\.-]?\s*", text)
        steps: list[dict[str, Any]] = []
        pos = 1
        for s in raw_steps:
            cleaned = s.strip()
            if len(cleaned) > 4 and cleaned.lower() not in title.lower():
                steps.append({"position": pos, "title": cleaned[:120], "description": cleaned})
                pos += 1

        candidate = VoiceProcedureCandidate(
            title=title,
            steps=steps,
            objective=f"Méthode formalisée par note vocale.",
        )

        return VoiceParseResponse(
            intent=VoiceIntent.PROCEDURE,
            confidence=0.80 if len(steps) > 1 else 0.55,
            original_transcript=text,
            procedure=candidate,
            extracted_entities={"title": title, "steps_count": len(steps)},
            summary_message=f"{title} avec {len(steps)} étape(s) identifiée(s).",
        )

    async def confirm_record(
        self, s: AsyncSession, org: str, user: str, req: VoiceConfirmRequest
    ) -> dict[str, Any]:
        if req.intent == VoiceIntent.SALE:
            # Check if payload is a list (batch) or contains 'sales' list
            items_to_create = []
            if isinstance(req.payload, list):
                items_to_create = req.payload
            elif isinstance(req.payload, dict) and "sales" in req.payload and isinstance(req.payload["sales"], list):
                items_to_create = req.payload["sales"]
            else:
                items_to_create = [req.payload]

            created_results = []
            for item in items_to_create:
                data = SaleCreate(**item, source=req.source)
                created = await self.register_service.create_sale(s, org, user, data)
                created_results.append({
                    "id": created.id,
                    "reference": created.reference,
                    "total_amount": str(created.total_amount),
                    "currency": created.currency,
                    "client_name": created.client_name,
                    "item_label": created.item_label,
                })

            if len(created_results) > 1:
                return {
                    "type": "sales_batch",
                    "count": len(created_results),
                    "sales": created_results,
                }
            created_first = created_results[0]
            return {
                "type": "sale",
                "id": created_first["id"],
                "reference": created_first["reference"],
                "total_amount": created_first["total_amount"],
                "currency": created_first["currency"],
                "client_name": created_first["client_name"],
                "item_label": created_first["item_label"],
            }
        elif req.intent == VoiceIntent.OFFER:
            data = OfferCreate(**req.payload, source=req.source)
            created = await self.register_service.create_offer(s, org, user, data)
            return {"type": "offer", "id": created.id, "name": created.name}
        elif req.intent == VoiceIntent.PROCEDURE:
            payload = {**req.payload}
            if "steps" in payload:
                payload["steps"] = [StepInput(**x) for x in payload["steps"]]
            data = ProcedureCreate(**payload, source=req.source)
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

        # 1. Try Whisper via Knowlia / AI Gateway
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
                            transcript=transcript.strip(),
                            confidence=float(data.get("confidence", 0.96)),
                            engine="Whisper AI HD (Knowlia Engine)",
                        )
        except Exception:
            pass

        # If transcription service is not connected, raise explicit error so frontend lets user edit/speak directly
        raise ApplicationError(
            "transcription_unavailable",
            "La transcription audio n'a pas pu être traitée par le serveur Whisper. Veuillez utiliser la dictée directe ou saisir le texte.",
            503,
        )
