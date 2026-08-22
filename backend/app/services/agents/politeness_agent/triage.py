"""Fast triage and classification engine for incoming user queries."""

import re
import random
from typing import Dict, List, Tuple
from .config import (
    PolitenessConfig,
    TriageCategory,
    TriageResult,
    Tone,
    Language,
)


class FastTriageEngine:
    """Ultra-fast regex & pattern-based classifier for chitchat, greetings, and tone."""

    def __init__(self, config: PolitenessConfig):
        self.config = config
        self._init_patterns()
        self._init_responses()

    def _init_patterns(self) -> None:
        """Compile regex patterns for quick matching."""
        # French patterns
        self.fr_greetings = re.compile(
            r"^\s*(bonjour|bonsoir|salut|coucou|hello|hi|hey|bien le bonjour|salutations)(\s+(monsieur|madame|l'équipe|à tous|tout le monde|à vous))?[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.fr_farewells = re.compile(
            r"^\s*(au revoir|bonne journée|bonne soiree|bonne soirée|bon week-end|bon weekend|à bientôt|a bientot|à plus|a plus|adieu|bye|bonne nuit|ciao|a\+)(\s+(à tous|tout le monde|et merci|et bonne journée|et bonne soirée|à vous|a vous))?[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.fr_gratitude = re.compile(
            r"^\s*(merci|merci beaucoup|un grand merci|merci bien|mille mercis|c'est gentil|je vous remercie|je te remercie|super merci|parfait merci|thx|thanks)(\s+(pour tout|pour votre aide|pour ton aide|beaucoup|d'avance|infiniment|aussi))?[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.fr_chitchat = re.compile(
            r"^\s*(comment ça va|comment ca va|comment allez-vous|comment allez vous|comment vas-tu|comment vas tu|comment tu vas|ça va|ca va|tu vas bien|vous allez bien|quoi de neuf|comment tu te portes)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.fr_inappropriate = re.compile(
            r"\b(connard|salope|putain|merde|imbécile|idiot|ferme ta gueule|fdp|tg|casse-toi|dégage)\b",
            re.IGNORECASE,
        )

        # Embedded greeting check in a real query
        self.fr_has_greeting_prefix = re.compile(
            r"^\s*(bonjour|bonsoir|salut|coucou|hello|hi|hey|bien le bonjour)(\s+(monsieur|madame|l'équipe|à tous))?[\s,\.!:;\-]+",
            re.IGNORECASE,
        )

        # English patterns
        self.en_greetings = re.compile(
            r"^\s*(hello|hi|hey|good morning|good afternoon|good evening|greetings|howdy)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.en_farewells = re.compile(
            r"^\s*(bye|goodbye|see you|have a nice day|have a good one|good night|farewell)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.en_gratitude = re.compile(
            r"^\s*(thanks|thank you|thank you very much|thanks a lot|many thanks|much appreciated)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.en_chitchat = re.compile(
            r"^\s*(how are you|how are you doing|how is it going|how do you do|what's up)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.en_inappropriate = re.compile(
            r"\b(fuck|shit|asshole|bitch|shut up|dick|idiot|stupid bot)\b",
            re.IGNORECASE,
        )
        self.en_has_greeting_prefix = re.compile(
            r"^\s*(hello|hi|hey|good morning|good afternoon|good evening)[\s,\.!:;\-]+",
            re.IGNORECASE,
        )

        # Spanish patterns
        self.es_greetings = re.compile(
            r"^\s*[¡¿]?(hola|buenos días|buenos dias|buenas tardes|buenas noches|saludos|que tal|qué tal)[\s!\.,\?:;~¡¿]*$",
            re.IGNORECASE,
        )
        self.es_farewells = re.compile(
            r"^\s*[¡¿]?(adiós|adios|hasta luego|hasta pronto|buen día|buen dia|chao|nos vemos)[\s!\.,\?:;~¡¿]*$",
            re.IGNORECASE,
        )
        self.es_gratitude = re.compile(
            r"^\s*[¡¿]?(gracias|muchas gracias|mil gracias|muy amable|agradecido|te agradezco)[\s!\.,\?:;~¡¿]*$",
            re.IGNORECASE,
        )
        self.es_chitchat = re.compile(
            r"^\s*[¡¿]?(cómo estás|como estas|cómo está|como esta|cómo te va|como te va|qué tal)[\s!\.,\?:;~¡¿]*$",
            re.IGNORECASE,
        )
        self.es_has_greeting_prefix = re.compile(
            r"^\s*[¡¿]?(hola|buenos días|buenos dias|buenas tardes|buenas noches)[\s,\.!:;\-¡¿]+",
            re.IGNORECASE,
        )

        # Portuguese patterns
        self.pt_greetings = re.compile(
            r"^\s*(olá|ola|bom dia|boa tarde|boa noite|oi|saudações|saudacoes)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.pt_farewells = re.compile(
            r"^\s*(adeus|tchau|até logo|ate logo|até breve|ate breve|bom descanso)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.pt_gratitude = re.compile(
            r"^\s*(obrigado|obrigada|muito obrigado|muito obrigada|agradecido|grato)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.pt_chitchat = re.compile(
            r"^\s*(como vai|tudo bem|como está|como esta|como você está|como voce esta)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.pt_has_greeting_prefix = re.compile(
            r"^\s*(olá|ola|bom dia|boa tarde|boa noite|oi)[\s,\.!:;\-]+",
            re.IGNORECASE,
        )

        # Arabic patterns
        self.ar_greetings = re.compile(
            r"^\s*(مرحبا|مرحباً|أهلا|اهلا|السلام عليكم|صباح الخير|مساء الخير|تحياتي)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.ar_farewells = re.compile(
            r"^\s*(وداعا|وداعاً|مع السلامة|إلى اللقاء|الى اللقاء|تصبح على خير|في أمان الله)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.ar_gratitude = re.compile(
            r"^\s*(شكرا|شكراً|شكرا جزيلا|شكراً جزيلاً|مشكور|تسلم|بارك الله فيك|يعطيك العافية)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.ar_chitchat = re.compile(
            r"^\s*(كيف حالك|كيف الحال|شلونك|كيفك|أخبارك|اخبارك|عساك بخير)[\s!\.,\?:;~]*$",
            re.IGNORECASE,
        )
        self.ar_has_greeting_prefix = re.compile(
            r"^\s*(مرحبا|مرحباً|أهلا|اهلا|السلام عليكم|صباح الخير|مساء الخير)[\s,\.!:;\-]+",
            re.IGNORECASE,
        )

    def _init_responses(self) -> None:
        """Initialize polite response templates tailored to each tone and language."""
        self.responses: Dict[Tuple[Language, Tone, TriageCategory], List[str]] = {
            # FRENCH - FORMAL (Vouvoiement strict)
            (Language.FR, Tone.FORMAL, TriageCategory.GREETING): [
                "Bonjour {user_name}. En quoi puis-je vous être utile aujourd'hui ?",
                "Bonjour. Je me tiens à votre entière disposition pour répondre à vos questions.",
            ],
            (Language.FR, Tone.FORMAL, TriageCategory.FAREWELL): [
                "Je vous en prie. Je vous souhaite une excellente journée.",
                "Au revoir et excellente continuation à vous.",
            ],
            (Language.FR, Tone.FORMAL, TriageCategory.GRATITUDE): [
                "Je vous en prie, c'est un plaisir de vous assister. N'hésitez pas si vous avez d'autres questions.",
                "Avec plaisir. Restant à votre entière disposition.",
            ],
            (Language.FR, Tone.FORMAL, TriageCategory.CHITCHAT): [
                "Je vous remercie, je fonctionne parfaitement. Comment puis-je vous assister dans vos démarches aujourd'hui ?",
            ],
            (Language.FR, Tone.FORMAL, TriageCategory.INAPPROPRIATE): [
                "Je reste à votre service pour vous apporter une assistance respectueuse et professionnelle.",
            ],

            # FRENCH - WARM (Vouvoiement chaleureux & bienveillant)
            (Language.FR, Tone.WARM, TriageCategory.GREETING): [
                "Bonjour {user_name} ! Comment puis-je vous aider aujourd'hui ?",
                "Bonjour et bienvenue ! Que puis-je faire pour vous accompagner ?",
            ],
            (Language.FR, Tone.WARM, TriageCategory.FAREWELL): [
                "Au revoir ! Passez une très belle journée !",
                "Avec plaisir, à très bientôt et excellente journée à vous !",
            ],
            (Language.FR, Tone.WARM, TriageCategory.GRATITUDE): [
                "Avec grand plaisir ! N'hésitez surtout pas si vous avez besoin d'autre chose.",
                "Je vous en prie ! C'est un plaisir de pouvoir vous aider.",
            ],
            (Language.FR, Tone.WARM, TriageCategory.CHITCHAT): [
                "Tout va très bien, merci beaucoup ! Et vous, comment puis-je vous aider aujourd'hui ?",
            ],
            (Language.FR, Tone.WARM, TriageCategory.INAPPROPRIATE): [
                "Restons courtois s'il vous plaît. Je suis là pour vous aider avec bienveillance.",
            ],

            # FRENCH - CASUAL (Tutoiement convivial)
            (Language.FR, Tone.CASUAL, TriageCategory.GREETING): [
                "Salut {user_name} ! Comment je peux t'aider aujourd'hui ?",
                "Hello ! Qu'est-ce que je peux faire pour toi ?",
            ],
            (Language.FR, Tone.CASUAL, TriageCategory.FAREWELL): [
                "À plus ! Passe une excellente journée !",
                "Salut et à très bientôt !",
            ],
            (Language.FR, Tone.CASUAL, TriageCategory.GRATITUDE): [
                "Avec plaisir ! N'hésite pas si tu as d'autres questions.",
                "De rien, ravi d'avoir pu t'aider !",
            ],
            (Language.FR, Tone.CASUAL, TriageCategory.CHITCHAT): [
                "Ça va super et toi ? Dis-moi comment je peux t'aider !",
            ],
            (Language.FR, Tone.CASUAL, TriageCategory.INAPPROPRIATE): [
                "On garde le sourire et le respect ! Que puis-je faire pour toi ?",
            ],

            # FRENCH - CONCISE
            (Language.FR, Tone.CONCISE, TriageCategory.GREETING): [
                "Bonjour. Que souhaitez-vous savoir ?",
            ],
            (Language.FR, Tone.CONCISE, TriageCategory.FAREWELL): [
                "Au revoir.",
            ],
            (Language.FR, Tone.CONCISE, TriageCategory.GRATITUDE): [
                "De rien.",
            ],
            (Language.FR, Tone.CONCISE, TriageCategory.CHITCHAT): [
                "Je suis opérationnel. Quelle est votre question ?",
            ],
            (Language.FR, Tone.CONCISE, TriageCategory.INAPPROPRIATE): [
                "Merci de rester respectueux.",
            ],

            # ENGLISH - FORMAL
            (Language.EN, Tone.FORMAL, TriageCategory.GREETING): [
                "Good day {user_name}. How may I assist you today?",
            ],
            (Language.EN, Tone.FORMAL, TriageCategory.FAREWELL): [
                "Goodbye and have a pleasant day.",
            ],
            (Language.EN, Tone.FORMAL, TriageCategory.GRATITUDE): [
                "You are most welcome. Please let me know if you require further assistance.",
            ],
            (Language.EN, Tone.FORMAL, TriageCategory.CHITCHAT): [
                "I am operating well, thank you. How may I be of service?",
            ],
            (Language.EN, Tone.FORMAL, TriageCategory.INAPPROPRIATE): [
                "I am here to assist you with professional courtesy.",
            ],

            # ENGLISH - WARM
            (Language.EN, Tone.WARM, TriageCategory.GREETING): [
                "Hello {user_name}! How can I help you today?",
            ],
            (Language.EN, Tone.WARM, TriageCategory.FAREWELL): [
                "Have a wonderful day! Goodbye!",
            ],
            (Language.EN, Tone.WARM, TriageCategory.GRATITUDE): [
                "You're very welcome! Feel free to ask if you need anything else.",
            ],
            (Language.EN, Tone.WARM, TriageCategory.CHITCHAT): [
                "I'm doing great, thank you! How can I help you today?",
            ],
            (Language.EN, Tone.WARM, TriageCategory.INAPPROPRIATE): [
                "Let's please keep our conversation respectful. How can I help you?",
            ],

            # SPANISH - WARM
            (Language.ES, Tone.WARM, TriageCategory.GREETING): [
                "¡Hola {user_name}! ¿Cómo puedo ayudarte hoy?",
                "¡Buenos días {user_name}! ¿En qué puedo orientarte hoy?",
            ],
            (Language.ES, Tone.WARM, TriageCategory.FAREWELL): [
                "¡Hasta pronto! ¡Que tengas un excelente día!",
            ],
            (Language.ES, Tone.WARM, TriageCategory.GRATITUDE): [
                "¡Con mucho gusto! No dudes en consultar si necesitas algo más.",
            ],
            (Language.ES, Tone.WARM, TriageCategory.CHITCHAT): [
                "¡Todo muy bien, gracias! ¿Cómo puedo asistirte hoy?",
            ],
            (Language.ES, Tone.WARM, TriageCategory.INAPPROPRIATE): [
                "Mantengamos una conversación respetuosa, por favor.",
            ],

            # PORTUGUESE - WARM
            (Language.PT, Tone.WARM, TriageCategory.GREETING): [
                "Olá {user_name}! Como posso ajudar você hoje?",
                "Bom dia {user_name}! Em que posso ser útil hoje?",
            ],
            (Language.PT, Tone.WARM, TriageCategory.FAREWELL): [
                "Até breve! Tenha um excelente dia!",
            ],
            (Language.PT, Tone.WARM, TriageCategory.GRATITUDE): [
                "Com muito prazer! Fique à vontade se precisar de mais informações.",
            ],
            (Language.PT, Tone.WARM, TriageCategory.CHITCHAT): [
                "Tudo ótimo por aqui, obrigado! Como posso ajudar você hoje?",
            ],
            (Language.PT, Tone.WARM, TriageCategory.INAPPROPRIATE): [
                "Vamos manter uma conversa respeitosa, por favor.",
            ],

            # ARABIC - WARM
            (Language.AR, Tone.WARM, TriageCategory.GREETING): [
                "مرحباً {user_name}! كيف يمكنني مساعدتك اليوم؟",
                "أهلاً بك {user_name}! فيمَ يمكنني تقديم المساعدة اليوم؟",
            ],
            (Language.AR, Tone.WARM, TriageCategory.FAREWELL): [
                "مع السلامة! أتمنى لك يوماً رائعاً وموفقاً!",
            ],
            (Language.AR, Tone.WARM, TriageCategory.GRATITUDE): [
                "على الرحب والسعة! لا تتردد في طلب أي مساعدة إضافية.",
            ],
            (Language.AR, Tone.WARM, TriageCategory.CHITCHAT): [
                "أنا بخير تماماً، شكراً لسؤالك! كيف يمكنني مساعدتك اليوم؟",
            ],
            (Language.AR, Tone.WARM, TriageCategory.INAPPROPRIATE): [
                "يرجى الحفاظ على الاحترام المتبادل في محادثتنا.",
            ],
        }

    def _get_response_for(self, category: TriageCategory) -> str:
        """Select a polite response matching language, tone and category."""
        key = (self.config.language, self.config.tone, category)
        if key not in self.responses:
            # Fallback to WARM in requested language or FR
            key = (self.config.language, Tone.WARM, category)
            if key not in self.responses:
                key = (Language.FR, Tone.WARM, category)
        
        choices = self.responses.get(key, ["Bonjour, comment puis-je vous aider ?"])
        resp = random.choice(choices)

        # Inject custom greeting template or assistant name if configured
        if self.config.custom_greeting_template and category == TriageCategory.GREETING:
            resp = self.config.custom_greeting_template
        elif self.config.assistant_name and category == TriageCategory.GREETING:
            if self.config.tone == Tone.CASUAL:
                resp = f"Salut, je suis {self.config.assistant_name} ! Comment je peux t'aider ?"
            else:
                resp = f"Bonjour, je suis {self.config.assistant_name}. Comment puis-je vous être utile ?"

        return self.config.format_text(resp)

    def triage(self, query: str) -> TriageResult:
        """
        Classify the query into either an immediate polite response or a RAG query.
        Also returns cleaned query without conversational prefix if needed.
        """
        cleaned = query.strip()
        if not cleaned:
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.GREETING,
                direct_response=self._get_response_for(TriageCategory.GREETING),
                detected_user_greeting=False,
            )

        # 1. Inappropriate check
        if self.fr_inappropriate.search(cleaned) or self.en_inappropriate.search(cleaned):
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.INAPPROPRIATE,
                direct_response=self._get_response_for(TriageCategory.INAPPROPRIATE),
            )

        # 2. Pure Greeting check (FR, EN, ES, PT, AR)
        if (
            self.fr_greetings.match(cleaned)
            or self.en_greetings.match(cleaned)
            or self.es_greetings.match(cleaned)
            or self.pt_greetings.match(cleaned)
            or self.ar_greetings.match(cleaned)
        ):
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.GREETING,
                direct_response=self._get_response_for(TriageCategory.GREETING),
                detected_user_greeting=True,
            )

        # 3. Pure Farewell check (FR, EN, ES, PT, AR)
        if (
            self.fr_farewells.match(cleaned)
            or self.en_farewells.match(cleaned)
            or self.es_farewells.match(cleaned)
            or self.pt_farewells.match(cleaned)
            or self.ar_farewells.match(cleaned)
        ):
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.FAREWELL,
                direct_response=self._get_response_for(TriageCategory.FAREWELL),
            )

        # 4. Pure Gratitude check (FR, EN, ES, PT, AR)
        if (
            self.fr_gratitude.match(cleaned)
            or self.en_gratitude.match(cleaned)
            or self.es_gratitude.match(cleaned)
            or self.pt_gratitude.match(cleaned)
            or self.ar_gratitude.match(cleaned)
        ):
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.GRATITUDE,
                direct_response=self._get_response_for(TriageCategory.GRATITUDE),
            )

        # 5. Pure Chitchat check (FR, EN, ES, PT, AR)
        if (
            self.fr_chitchat.match(cleaned)
            or self.en_chitchat.match(cleaned)
            or self.es_chitchat.match(cleaned)
            or self.pt_chitchat.match(cleaned)
            or self.ar_chitchat.match(cleaned)
        ):
            return TriageResult(
                is_rag_query=False,
                category=TriageCategory.CHITCHAT,
                direct_response=self._get_response_for(TriageCategory.CHITCHAT),
            )

        # 6. Real RAG Query with optional greeting prefix
        has_greeting = bool(
            self.fr_has_greeting_prefix.match(cleaned)
            or self.en_has_greeting_prefix.match(cleaned)
            or self.es_has_greeting_prefix.match(cleaned)
            or self.pt_has_greeting_prefix.match(cleaned)
            or self.ar_has_greeting_prefix.match(cleaned)
        )

        return TriageResult(
            is_rag_query=True,
            category=TriageCategory.RAG_QUERY,
            direct_response=None,
            detected_user_greeting=has_greeting,
        )
