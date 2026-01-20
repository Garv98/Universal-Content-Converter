import re

WORDS_TO_REMOVE = {
    'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
    'to', 'of', 'for', 'and', 'or', 'but', 'very', 'really', 'just'
}

ASL_REPLACEMENTS = {
    "don't": "NOT",
    "doesn't": "NOT",
    "didn't": "NOT",
    "won't": "NOT",
    "can't": "NOT CAN",
    "cannot": "NOT CAN",
    "isn't": "NOT",
    "aren't": "NOT",
    "wasn't": "NOT",
    "weren't": "NOT",
    "haven't": "NOT",
    "hasn't": "NOT",
    "i'm": "I",
    "you're": "YOU",
    "he's": "HE",
    "she's": "SHE",
    "it's": "IT",
    "we're": "WE",
    "they're": "THEY",
    "i've": "I FINISH",
    "you've": "YOU FINISH",
    "what's": "WHAT",
    "there's": "THERE",
    "here's": "HERE",
}

TIME_WORDS = ['yesterday', 'today', 'tomorrow', 'now', 'later', 'before', 'after', 
              'morning', 'afternoon', 'evening', 'night', 'week', 'month', 'year']

QUESTION_WORDS = ['what', 'where', 'when', 'who', 'why', 'how', 'which']


def generate_gloss(text):
    if not text or len(text.strip()) == 0:
        return {
            "success": False,
            "error": "No text provided"
        }
    
    try:
        sentences = re.split(r'[.!?]+', text)
        gloss_sentences = []
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            gloss = _convert_sentence_to_gloss(sentence)
            if gloss:
                gloss_sentences.append(gloss)
        
        full_gloss = " / ".join(gloss_sentences)
        
        return {
            "success": True,
            "original": text,
            "gloss": full_gloss,
            "sentence_count": len(gloss_sentences),
            "notation_guide": _get_notation_guide(),
            "note": "This is simplified ASL gloss. Real ASL includes facial expressions, spatial grammar, and non-manual markers."
        }
        
    except Exception as e:
        return {
            "success": False,
            "original": text,
            "error": str(e)
        }


def _convert_sentence_to_gloss(sentence):
    text = sentence.lower().strip()
    
    for eng, asl in ASL_REPLACEMENTS.items():
        text = re.sub(rf'\b{eng}\b', asl.lower(), text)
    
    text = re.sub(r'[^\w\s-]', '', text)
    
    words = text.split()
    
    is_question = any(w in QUESTION_WORDS for w in words)
    
    time_indicators = []
    other_words = []
    
    for word in words:
        if word in TIME_WORDS:
            time_indicators.append(word.upper())
        elif word not in WORDS_TO_REMOVE:
            other_words.append(word.upper())
    
    
    gloss_parts = []
    
    if time_indicators:
        gloss_parts.extend(time_indicators)
    
    gloss_parts.extend(other_words)
    
    if is_question:
        gloss_parts.append("[Q]")
    
    return " ".join(gloss_parts)


def _get_notation_guide():
    return {
        "UPPERCASE": "Represents a sign",
        "[Q]": "Question - raise eyebrows",
        "[NEG]": "Negation - shake head",
        "/": "Sentence boundary",
        "fs-WORD": "Fingerspelling",
        "WORD++": "Repeated sign (plural/emphasis)"
    }


def text_to_fingerspelling(text):
    clean = re.sub(r'[^a-zA-Z]', '', text)
    
    fs = "-".join(clean.upper())
    
    return {
        "original": text,
        "fingerspelling": f"fs-{fs}",
        "note": "Each letter is signed individually"
    }
