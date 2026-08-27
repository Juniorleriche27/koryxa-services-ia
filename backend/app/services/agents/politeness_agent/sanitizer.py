"""Query sanitizer to clean conversational pleasantries before vector retrieval."""

import re


class QuerySanitizer:
    """
    Cleans incoming queries from conversational noise, politeness prefixes,
    and trailing questions, delivering clean semantic text for Vector DB search.
    """

    def __init__(self) -> None:
        # Prefixes to strip (French)
        self.fr_prefixes = [
            r"^(bonjour|bonsoir|salut|coucou|hello|hi|hey)(\s+(monsieur|madame|l'équipe|à tous))?[\s,\.\!\?:\-]+",
            r"^(s'il vous plaît|s'il te plaît|svp|stp)[\s,\.\!\?:\-]+",
            r"^(est-ce que vous pourriez m'indiquer|pouvez-vous me dire|pourriez-vous me dire|peux-tu me dire|je voudrais savoir|j'aimerais savoir|sauriez-vous|dites-moi)[\s,\.\!\?:\-]+",
            r"^(est-ce que vous savez|je me demandais|savez-vous si|merci de me dire)[\s,\.\!\?:\-]+",
            r"^(comment faire pour|dans quelle mesure|y a-t-il un moyen de)[\s]+",
        ]

        # Suffixes to strip (French)
        self.fr_suffixes = [
            r"[\s,\.\!\?:\-]+(s'il vous plaît|s'il te plaît|svp|stp|merci d'avance|merci beaucoup|merci|cdlt|cordialement)[\s\.\!\?]*$",
        ]

        # Prefixes to strip (English)
        self.en_prefixes = [
            r"^(hello|hi|hey|good morning|good afternoon|good evening)[\s,\.\!\?:\-]+",
            r"^(please|could you please tell me|can you tell me|would you be able to tell me|i would like to know|i want to know)[\s,\.\!\?:\-]+",
            r"^(do you know if|i was wondering if|could you kindly explain)[\s,\.\!\?:\-]+",
        ]

        # Suffixes to strip (English)
        self.en_suffixes = [
            r"[\s,\.\!\?:\-]+(please|thanks in advance|thank you very much|thanks|regards)[\s\.\!\?]*$",
        ]

        # Prefixes to strip (Spanish)
        self.es_prefixes = [
            r"^(hola|buenos días|buenos dias|buenas tardes|buenas noches)[\s,\.\!\?:\-]+",
            r"^(por favor|porfa|dime|podrías decirme|puedes decirme|quisiera saber|me gustaría saber)[\s,\.\!\?:\-]+",
        ]

        # Suffixes to strip (Spanish)
        self.es_suffixes = [
            r"[\s,\.\!\?:\-]+(por favor|porfa|muchas gracias|gracias|saludos)[\s\.\!\?]*$",
        ]

        # Prefixes to strip (Portuguese)
        self.pt_prefixes = [
            r"^(olá|ola|bom dia|boa tarde|boa noite|oi)[\s,\.\!\?:\-]+",
            r"^(por favor|por gentileza|você poderia me dizer|pode me dizer|gostaria de saber|quero saber)[\s,\.\!\?:\-]+",
        ]

        # Suffixes to strip (Portuguese)
        self.pt_suffixes = [
            r"[\s,\.\!\?:\-]+(por favor|por gentileza|muito obrigado|obrigado|obrigada|valeu)[\s\.\!\?]*$",
        ]

        # Prefixes to strip (Arabic)
        self.ar_prefixes = [
            r"^(مرحبا|مرحباً|أهلا|اهلا|السلام عليكم|صباح الخير|مساء الخير)[\s,\.\!\?:\-]+",
            r"^(من فضلك|لو سمحت|هل يمكنك إخباري|هل يمكن إخباري|أود أن أعرف|أريد معرفة)[\s,\.\!\?:\-]+",
        ]

        # Suffixes to strip (Arabic)
        self.ar_suffixes = [
            r"[\s,\.\!\?:\-]+(من فضلك|لو سمحت|شكراً جزيلاً|شكرا جزيلا|شكراً|شكرا|مع الشكر)[\s\.\!\?]*$",
        ]

        # Compile regexes
        all_prefixes = self.fr_prefixes + self.en_prefixes + self.es_prefixes + self.pt_prefixes + self.ar_prefixes
        all_suffixes = self.fr_suffixes + self.en_suffixes + self.es_suffixes + self.pt_suffixes + self.ar_suffixes
        self._prefix_regexes = [re.compile(p, re.IGNORECASE) for p in all_prefixes]
        self._suffix_regexes = [re.compile(s, re.IGNORECASE) for s in all_suffixes]

    def sanitize(self, query: str) -> str:
        """
        Removes conversational wrappers and returns clean semantic query.
        
        Example:
            Input: "Bonjour, pourriez-vous me dire comment renouveler mon passeport svp ?"
            Output: "comment renouveler mon passeport"
        """
        cleaned = query.strip()
        if not cleaned:
            return ""

        # Progressively strip matching prefixes
        changed = True
        iterations = 0
        while changed and iterations < 5:
            changed = False
            iterations += 1
            for pattern in self._prefix_regexes:
                match = pattern.match(cleaned)
                if match:
                    cleaned = cleaned[match.end():].strip()
                    changed = True

        # Progressively strip matching suffixes
        changed = True
        iterations = 0
        while changed and iterations < 5:
            changed = False
            iterations += 1
            for pattern in self._suffix_regexes:
                match = pattern.search(cleaned)
                if match:
                    cleaned = cleaned[:match.start()].strip()
                    changed = True

        # Clean trailing punctuation like stray commas, question marks or semicolons
        cleaned = re.sub(r"^[\s,\.\!\?:\-;]+", "", cleaned)
        cleaned = re.sub(r"[\s,\:;\-]+$", "", cleaned).strip()

        # If over-stripped, fallback to original query
        if len(cleaned) < 3:
            return query.strip()

        return cleaned
