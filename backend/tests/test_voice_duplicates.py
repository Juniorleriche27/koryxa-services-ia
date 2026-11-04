from app.services.voice import clean_speech_duplicates


def test_clean_speech_duplicates_multi_word_repetition() -> None:
    text = "Vente de 10 cartons vente de 10 cartons"
    assert clean_speech_duplicates(text) == "Vente de 10 cartons"


def test_clean_speech_duplicates_single_word_repetition() -> None:
    text = "client Koffi Koffi a payé par Wave"
    assert clean_speech_duplicates(text) == "client Koffi a payé par Wave"


def test_clean_speech_duplicates_mid_sentence_phrase() -> None:
    text = "Bonjour je vends 5 sacs de riz 5 sacs de riz pour monsieur Yao"
    assert clean_speech_duplicates(text) == "Bonjour je vends 5 sacs de riz pour monsieur Yao"


def test_clean_speech_duplicates_preserves_legitimate_repeated_syllables() -> None:
    assert clean_speech_duplicates("un bon bonbon") == "un bon bonbon"
    assert clean_speech_duplicates("du couscous") == "du couscous"
    assert clean_speech_duplicates("avancer pas à pas") == "avancer pas à pas"
    assert clean_speech_duplicates("traduire mot à mot") == "traduire mot à mot"


def test_clean_speech_duplicates_empty_or_blank() -> None:
    assert clean_speech_duplicates("") == ""
    assert clean_speech_duplicates("   ") == ""
