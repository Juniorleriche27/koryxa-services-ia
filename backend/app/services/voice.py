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
        # Match patterns like: 150 000, 150000, 15.000, 15,50
        # Clean currency words and extract numbers
        normalized = re.sub(r"(?i)\b(fcfa|cfa|francs?|f|euros?|€|dollars?|\$)\b", "", text)
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

    def _extract_currency(self, text: str) -> str:
        lower = text.lower()
        if any(c in lower for c in ["euro", "€", "eur"]):
            return "EUR"
        if any(c in lower for c in ["dollar", "$", "usd"]):
            return "USD"
        return "XOF"

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

    def _parse_sale(self, text: str) -> VoiceParseResponse:
        amounts = self._extract_amounts(text)
        currency = self._extract_currency(text)
        payment_method, payment_status = self._extract_payment_method(text)
        client_name = self._extract_client_name(text)

        # Quantity and Total calculation
        quantity = Decimal("1")
        total_amount = Decimal("0")
        unit_price = Decimal("0")

        # 1. Quantity Detection (ex: "3 sacs", "3 ordinateurs", "10 cartons")
        qty_match = re.search(
            r"(?i)\b(?:quantité|qté)?\s*(\d{1,4})\s+(sacs?|cartons?|articles?|unités?|pièces?|boites?|heures?|jours?|ordinateurs?|produits?|exemplaires?|livres?|bouteilles?|packs?)\b",
            text,
        )
        if qty_match:
            try:
                quantity = Decimal(qty_match.group(1))
            except Exception:
                quantity = Decimal("1")

        # Exclude extracted quantity number from monetary amounts list
        if qty_match and quantity in amounts and len(amounts) > 1:
            amounts = [a for a in amounts if a != quantity]

        # 2. Item Label Detection
        item_label = "Vente non détaillée"
        item_match = re.search(
            r"(?i)(?:vente\s+(?:de|d')?|vendu\s+|produit\s+|article\s+|service\s+)(.+?)(?=\s+(?:à|pour|au\s+prix|montant|payé|par|\d+|$))",
            text,
        )
        if item_match:
            cand = item_match.group(1).strip()
            normalized_cand = re.sub(r"[^a-zà-ÿ]+", " ", cand.lower()).strip()
            stopwords = {
                "non", "non paye", "non payes", "non payee", "non payees",
                "paye", "payes", "payee", "payees", "impaye", "impayee",
                "partiel", "partielle", "credit", "a credit",
            }
            if (
                len(cand) >= 2
                and not bool(re.search(r"\d", cand))
                and normalized_cand not in stopwords
            ):
                item_label = cand

        # 3. Per-unit price vs Total calculation
        is_per_unit = bool(re.search(
            r"(?i)\b(?:par\s+(?:unité|unite|pièce|piece|article|sac|carton|ordinateur|personne|heure|jour|mois|licence|boite|bouteille|exemplaire|kg|kilo|litre|produit)|l'unité|l'unite|chacun|la\s+pièce|la\s+piece|l'une|par\s+tête)\b",
            text,
        ))

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

        ref_code = f"VOC-{date.today().strftime('%Y%m%d')}-{str(uuid4())[:4].upper()}"
        confidence = 0.90 if amounts and item_label != "Vente non détaillée" else 0.70 if amounts else 0.50

        candidate = VoiceSaleCandidate(
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

        payment_label = {
            PaymentStatus.PAID: "payée",
            PaymentStatus.UNPAID: "non payée",
            PaymentStatus.PARTIAL: "partiellement payée",
            PaymentStatus.REFUNDED: "remboursée",
        }.get(payment_status, str(payment_status))

        return VoiceParseResponse(
            intent=VoiceIntent.SALE,
            confidence=confidence,
            original_transcript=text,
            sale=candidate,
            extracted_entities={
                "client": client_name,
                "amount": str(total_amount),
                "unit_price": str(unit_price),
                "quantity": str(quantity),
                "currency": currency,
                "payment_method": payment_method,
                "payment_status": payment_status,
                "item": item_label,
            },
            summary_message=f"{item_label} — total de {total_amount} {currency}, "
            f"{payment_label}, client : {client_name or 'non renseigné'}.",
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
            data = SaleCreate(**req.payload, source=req.source)
            created = await self.register_service.create_sale(s, org, user, data)
            return {
                "type": "sale",
                "id": created.id,
                "reference": created.reference,
                "total_amount": str(created.total_amount),
                "currency": created.currency,
                "client_name": created.client_name,
                "item_label": created.item_label,
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
