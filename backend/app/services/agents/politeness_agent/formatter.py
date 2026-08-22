"""Post-processing and response formatter enforcing tone, politeness, and empathetic fallbacks."""

import re
from typing import Optional
from .config import PolitenessConfig, Tone, Language, PolishedResponse


class ResponsePolisher:
    """Enforces tone, handles diplomatic fallbacks, and standardizes RAG outputs."""

    def __init__(self, config: PolitenessConfig):
        self.config = config
        self._init_fallback_messages()

    def _init_fallback_messages(self) -> None:
        """Standard polite fallback responses when documents lack information."""
        self.fallbacks = {
            (Language.FR, Tone.FORMAL): (
                "D'après les documents actuellement à ma disposition, je ne dispose malheureusement pas "
                "d'informations suffisantes pour répondre avec certitude à cette demande. "
                "Je vous invite à contacter notre support ou à consulter notre documentation complémentaire."
            ),
            (Language.FR, Tone.WARM): (
                "D'après les éléments dont je dispose dans notre base documentaire, je n'ai malheureusement pas trouvé "
                "la réponse exacte à votre question. N'hésitez pas à reformuler votre demande ou à vous rapprocher de notre équipe !"
            ),
            (Language.FR, Tone.CASUAL): (
                "Je n'ai pas trouvé l'info dans nos documents actuels ! "
                "N'hésite pas à reformuler ta question ou à demander directement à l'équipe."
            ),
            (Language.FR, Tone.CONCISE): (
                "Information non disponible dans les documents de référence."
            ),
            (Language.EN, Tone.FORMAL): (
                "Based on the documents currently available, I unfortunately do not have sufficient information "
                "to answer your query with certainty. Please reach out to support for further guidance."
            ),
            (Language.EN, Tone.WARM): (
                "Based on our available documentation, I couldn't find a direct answer to your question. "
                "Feel free to rephrase or reach out to our team if you need more details!"
            ),
            (Language.EN, Tone.CASUAL): (
                "Couldn't find that info in our current docs! "
                "Feel free to rephrase or ping the team directly."
            ),
            (Language.ES, Tone.WARM): (
                "Según la información disponible en nuestra documentación, lamentablemente no he encontrado "
                "una respuesta exacta a tu consulta. ¡No dudes en reformular tu pregunta o contactar a nuestro equipo!"
            ),
            (Language.PT, Tone.WARM): (
                "Com base nas informações disponíveis em nossa base de documentos, infelizmente não encontrei "
                "uma resposta exata para sua pergunta. Sinta-se à vontade para reformular ou falar com nossa equipe!"
            ),
            (Language.AR, Tone.WARM): (
                "بناءً على الوثائق المتاحة حالياً، للأسف لم أتمكن من العثور على إجابة دقيقة لسؤالك. "
                "لا تتردد في إعادة صياغة السؤال أو التواصل مع فريق العمل!"
            ),
        }

        # Dry/unfriendly phrases to detect and soften
        self.dry_phrases_fr = [
            r"^\s*(aucun document trouvé|je ne trouve pas|je ne sais pas|information non disponible|pas d'information|aucune information|je n'ai pas la réponse|je n'ai pas trouvé de document)[\s\.\!]*$",
            r"^\s*(je ne peux pas répondre|impossible de répondre avec le contexte fourni)[\s\.\!]*$",
        ]
        self.dry_phrases_en = [
            r"^\s*(no document found|i don't know|information not available|no information|i don't have the answer)[\s\.\!]*$",
            r"^\s*(cannot answer based on context|unable to find relevant docs)[\s\.\!]*$",
        ]
        self.dry_phrases_es = [
            r"^\s*(no se encontró información|no se encontraron documentos|no sé|no tengo esa información|no puedo responder)[\s\.\!]*$",
        ]
        self.dry_phrases_pt = [
            r"^\s*(nenhum documento encontrado|não sei|informação não disponível|não tenho essa informação|não posso responder)[\s\.\!]*$",
        ]
        self.dry_phrases_ar = [
            r"^\s*(لم يتم العثور على مستندات|لا أعرف|لا توجد معلومات|المعلومات غير متوفرة|لا أستطيع الإجابة)[\s\.\!]*$",
        ]

        all_dry = self.dry_phrases_fr + self.dry_phrases_en + self.dry_phrases_es + self.dry_phrases_pt + self.dry_phrases_ar
        self._dry_regexes = [re.compile(p, re.IGNORECASE) for p in all_dry]

    def is_dry_negative_response(self, text: str) -> bool:
        """Check if the RAG response is a dry 'not found' message."""
        cleaned = text.strip()
        return any(regex.match(cleaned) for regex in self._dry_regexes)

    def get_fallback_message(self) -> str:
        """Retrieve the appropriate polite fallback message."""
        if self.config.custom_fallback_message:
            return self.config.format_text(self.config.custom_fallback_message)

        key = (self.config.language, self.config.tone)
        if key not in self.fallbacks:
            key = (self.config.language, Tone.WARM)
            if key not in self.fallbacks:
                key = (Language.FR, Tone.WARM)
        return self.config.format_text(self.fallbacks[key])

    def polish(
        self,
        raw_rag_response: str,
        query: Optional[str] = None,
        context_found: bool = True,
        user_greeted: bool = False,
    ) -> PolishedResponse:
        """
        Applies all politeness, tone, and formatting rules to the raw RAG output.

        Args:
            raw_rag_response: Raw text generated by the RAG LLM.
            query: Original user query.
            context_found: Whether the retriever found matching documents.
            user_greeted: Whether the user started their interaction with a greeting.
        """
        text = raw_rag_response.strip()
        was_softened = False

        # 1. Handle missing context / dry no-match responses
        # Only replace if text is actually empty or a dry negative response
        if not text or self.is_dry_negative_response(text):
            if not context_found or self.config.soften_no_results:
                text = self.get_fallback_message()
                was_softened = True

        # 2. Greeting injection if applicable
        if self.config.auto_greet and user_greeted and not was_softened:
            # Check if LLM already started with a greeting
            has_greeting = bool(
                re.match(r"^\s*(bonjour|bonsoir|salut|hello|hi|hey|hola|olá|ola|مرحبا|أهلا|اهلا)[\s,\.\!]", text, re.IGNORECASE)
            )
            if not has_greeting:
                if self.config.custom_greeting_template:
                    greeting = self.config.format_text(self.config.custom_greeting_template)
                elif self.config.language == Language.ES:
                    greeting = "¡Hola! "
                elif self.config.language == Language.PT:
                    greeting = "Olá! "
                elif self.config.language == Language.AR:
                    greeting = "مرحباً! "
                elif self.config.tone == Tone.CASUAL:
                    greeting = "Salut ! "
                elif self.config.tone == Tone.FORMAL:
                    greeting = "Bonjour. "
                elif self.config.tone == Tone.CONCISE:
                    greeting = ""
                else:
                    greeting = "Bonjour ! "
                
                if greeting:
                    text = f"{greeting}{text}"

        # 3. Tone enforcement: convert accidental tutoiement/vouvoiement if desired
        if self.config.language == Language.FR:
            if self.config.tone == Tone.CASUAL:
                text = self._french_to_casual(text)
            elif self.config.tone in (Tone.FORMAL, Tone.WARM):
                text = self._french_to_vouvoiement(text)

        # 4. Format any dynamic placeholders
        text = self.config.format_text(text)

        # 5. Optional polite signoff
        if self.config.add_signoff:
            signoff = self._get_signoff()
            if signoff and not text.endswith(signoff):
                text = f"{text}\n\n{signoff}"

        return PolishedResponse(
            final_text=text,
            tone_applied=self.config.tone,
            was_softened=was_softened,
            metadata={
                "language": self.config.language.value,
                "user_greeted": user_greeted,
                "context_found": context_found,
            },
        )

    def _french_to_casual(self, text: str) -> str:
        """Softly replace obvious formal markers with casual ones when in CASUAL mode."""
        replacements = [
            (r"\bN'hésitez pas à me poser d'autres questions\b", "N'hésite pas si tu as d'autres questions"),
            (r"\bJe reste à votre disposition\b", "Je reste dispo si besoin"),
            (r"\bSi vous avez des questions\b", "Si tu as des questions"),
            (r"\bJe vous invite à\b", "Je t'invite à"),
            (r"\bJe vous conseille de\b", "Je te conseille de"),
        ]
        res = text
        for pattern, repl in replacements:
            res = re.sub(pattern, repl, res, flags=re.IGNORECASE)
        return res

    def _french_to_vouvoiement(self, text: str) -> str:
        """Softly replace accidental casual markers when in FORMAL/WARM mode."""
        replacements = [
            (r"\bN'hésite pas si tu as d'autres questions\b", "N'hésitez pas si vous avez d'autres questions"),
            (r"\bJe reste dispo si besoin\b", "Je reste à votre entière disposition"),
            (r"\bSi tu as des questions\b", "Si vous avez des questions"),
            (r"\bJe t'invite à\b", "Je vous invite à"),
            (r"\bJe te conseille de\b", "Je vous conseille de"),
        ]
        res = text
        for pattern, repl in replacements:
            res = re.sub(pattern, repl, res, flags=re.IGNORECASE)
        return res

    def _get_signoff(self) -> str:
        """Generate closing signoff based on tone."""
        if self.config.language == Language.FR:
            if self.config.tone == Tone.FORMAL:
                return "Restant à votre entière disposition,\nBien cordialement."
            elif self.config.tone == Tone.WARM:
                return "Belle journée à vous !"
            elif self.config.tone == Tone.CASUAL:
                return "À bientôt !"
        elif self.config.language == Language.ES:
            return "¡Que tengas un excelente día!"
        elif self.config.language == Language.PT:
            return "Tenha um ótimo dia!"
        elif self.config.language == Language.AR:
            return "أتمنى لك يوماً سعيداً وموفقاً!"
        return ""
