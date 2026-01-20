import os
import base64
import tempfile
from io import BytesIO

SUPPORTED_LANGUAGES = {
    "hi": {"name": "Hindi", "native": "हिन्दी", "gtts_code": "hi"},
    "ta": {"name": "Tamil", "native": "தமிழ்", "gtts_code": "ta"},
    "te": {"name": "Telugu", "native": "తెలుగు", "gtts_code": "te"},
    "bn": {"name": "Bengali", "native": "বাংলা", "gtts_code": "bn"},
    "mr": {"name": "Marathi", "native": "मराठी", "gtts_code": "mr"},
    "gu": {"name": "Gujarati", "native": "ગુજરાતી", "gtts_code": "gu"},
    "kn": {"name": "Kannada", "native": "ಕನ್ನಡ", "gtts_code": "kn"},
    "ml": {"name": "Malayalam", "native": "മലയാളം", "gtts_code": "ml"},
    "pa": {"name": "Punjabi", "native": "ਪੰਜਾਬੀ", "gtts_code": "pa"},
    "or": {"name": "Odia", "native": "ଓଡ଼ିଆ", "gtts_code": "or"},
    "as": {"name": "Assamese", "native": "অসমীয়া", "gtts_code": "as"},
    "ur": {"name": "Urdu", "native": "اردو", "gtts_code": "ur"},
    
    "es": {"name": "Spanish", "native": "Español", "gtts_code": "es"},
    "fr": {"name": "French", "native": "Français", "gtts_code": "fr"},
    "de": {"name": "German", "native": "Deutsch", "gtts_code": "de"},
    "zh-CN": {"name": "Chinese (Simplified)", "native": "中文", "gtts_code": "zh-CN"},
    "zh-TW": {"name": "Chinese (Traditional)", "native": "繁體中文", "gtts_code": "zh-TW"},
    "ja": {"name": "Japanese", "native": "日本語", "gtts_code": "ja"},
    "ko": {"name": "Korean", "native": "한국어", "gtts_code": "ko"},
    "ar": {"name": "Arabic", "native": "العربية", "gtts_code": "ar"},
    "pt": {"name": "Portuguese", "native": "Português", "gtts_code": "pt"},
    "ru": {"name": "Russian", "native": "Русский", "gtts_code": "ru"},
    "it": {"name": "Italian", "native": "Italiano", "gtts_code": "it"},
    "nl": {"name": "Dutch", "native": "Nederlands", "gtts_code": "nl"},
    "pl": {"name": "Polish", "native": "Polski", "gtts_code": "pl"},
    "tr": {"name": "Turkish", "native": "Türkçe", "gtts_code": "tr"},
    "vi": {"name": "Vietnamese", "native": "Tiếng Việt", "gtts_code": "vi"},
    "th": {"name": "Thai", "native": "ไทย", "gtts_code": "th"},
    "id": {"name": "Indonesian", "native": "Bahasa Indonesia", "gtts_code": "id"},
    "ms": {"name": "Malay", "native": "Bahasa Melayu", "gtts_code": "ms"},
    "fil": {"name": "Filipino", "native": "Filipino", "gtts_code": "fil"},
    "uk": {"name": "Ukrainian", "native": "Українська", "gtts_code": "uk"},
    "cs": {"name": "Czech", "native": "Čeština", "gtts_code": "cs"},
    "el": {"name": "Greek", "native": "Ελληνικά", "gtts_code": "el"},
    "he": {"name": "Hebrew", "native": "עברית", "gtts_code": "iw"},
    "sv": {"name": "Swedish", "native": "Svenska", "gtts_code": "sv"},
    "da": {"name": "Danish", "native": "Dansk", "gtts_code": "da"},
    "fi": {"name": "Finnish", "native": "Suomi", "gtts_code": "fi"},
    "no": {"name": "Norwegian", "native": "Norsk", "gtts_code": "no"},
    "ro": {"name": "Romanian", "native": "Română", "gtts_code": "ro"},
    "hu": {"name": "Hungarian", "native": "Magyar", "gtts_code": "hu"},
    "sk": {"name": "Slovak", "native": "Slovenčina", "gtts_code": "sk"},
    "bg": {"name": "Bulgarian", "native": "Български", "gtts_code": "bg"},
    "hr": {"name": "Croatian", "native": "Hrvatski", "gtts_code": "hr"},
    "sr": {"name": "Serbian", "native": "Српски", "gtts_code": "sr"},
    "fa": {"name": "Persian", "native": "فارسی", "gtts_code": "fa"},
    "sw": {"name": "Swahili", "native": "Kiswahili", "gtts_code": "sw"},
    "af": {"name": "Afrikaans", "native": "Afrikaans", "gtts_code": "af"},
}


def translate_text(text, target_languages=None, include_audio=True):
    if target_languages is None:
        target_languages = ["hi", "ta", "es", "fr", "de", "zh-CN"]
    
    if isinstance(target_languages, str):
        target_languages = [target_languages]
    
    if not text or len(text.strip()) == 0:
        return {
            "success": False,
            "original": text,
            "translations": {},
            "error": "No text provided"
        }
    
    try:
        result = _translate_with_deep_translator(text, target_languages, include_audio)
        if result["success"]:
            print("✅ Used FREE Google Translate (deep-translator)")
            return result
    except Exception as e:
        print(f"⚠️ deep-translator failed: {e}")
        print("ℹ️ Falling back to local translation models...")
        return _translate_with_local_models(text, target_languages)
    
    return {
        "success": False,
        "original": text,
        "translations": {},
        "error": "Translation services unavailable"
    }


def _translate_with_deep_translator(text, target_languages, include_audio=True):
    """deep-translator and gTTS for audio"""
    try:
        from deep_translator import GoogleTranslator
        from gtts import gTTS
        
        translations = {}
        errors = []
        
        for lang_code in target_languages:
            if lang_code not in SUPPORTED_LANGUAGES:
                errors.append(f"Unsupported language: {lang_code}")
                continue
            
            lang_info = SUPPORTED_LANGUAGES[lang_code]
            
            try:
                translator = GoogleTranslator(source='auto', target=lang_code)
                
                if len(text) > 5000:
                    chunks = [text[i:i+4900] for i in range(0, len(text), 4900)]
                    translated_chunks = [translator.translate(chunk) for chunk in chunks]
                    translated_text = " ".join(translated_chunks)
                else:
                    translated_text = translator.translate(text)
                
                translations[lang_info["name"]] = {
                    "text": translated_text,
                    "native_name": lang_info["native"],
                    "language_code": lang_code
                }
                
                if include_audio:
                    try:
                        audio_base64 = _generate_gtts_audio(translated_text, lang_info["gtts_code"])
                        translations[lang_info["name"]]["audio"] = audio_base64
                    except Exception as tts_error:
                        print(f"⚠️ gTTS failed for {lang_code}: {tts_error}")
                
                print(f"✅ Translated to {lang_info['name']}")
                
            except Exception as lang_error:
                errors.append(f"{lang_info['name']}: {str(lang_error)}")
                print(f"❌ Failed to translate to {lang_code}: {lang_error}")
        
        return {
            "success": len(translations) > 0,
            "original": text,
            "translations": translations,
            "errors": errors if errors else None,
            "model": "FREE Google Translate (deep-translator)",
            "audio_enabled": include_audio
        }
        
    except ImportError:
        raise Exception("Install deep-translator: pip install deep-translator gtts")
    except Exception as e:
        raise Exception(f"Translation error: {str(e)}")


def _generate_gtts_audio(text, language_code):
    from gtts import gTTS
    
    if len(text) > 5000:
        text = text[:4997] + "..."
    
    tts = gTTS(text=text, lang=language_code, slow=False)
    
    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    
    audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
    
    return audio_base64


def _translate_with_local_models(text, target_languages):
    """fallback use local Helsinki-NLP MarianMT models"""
    
    LOCAL_MODELS = {
        "es": "Helsinki-NLP/opus-mt-en-es",
        "fr": "Helsinki-NLP/opus-mt-en-fr",
        "de": "Helsinki-NLP/opus-mt-en-de",
        "hi": "Helsinki-NLP/opus-mt-en-hi",
        "zh": "Helsinki-NLP/opus-mt-en-zh",
    }
    
    translations = {}
    errors = []
    
    try:
        from transformers import MarianMTModel, MarianTokenizer
        
        for lang_code in target_languages:
            if lang_code not in LOCAL_MODELS:
                errors.append(f"{lang_code}: Not available in local models")
                continue
            
            if lang_code not in SUPPORTED_LANGUAGES:
                continue
            
            lang_info = SUPPORTED_LANGUAGES[lang_code]
            
            try:
                model_name = LOCAL_MODELS[lang_code]
                tokenizer = MarianTokenizer.from_pretrained(model_name)
                model = MarianMTModel.from_pretrained(model_name)
                
                inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
                translated_tokens = model.generate(**inputs, max_length=512)
                translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
                
                translations[lang_info["name"]] = {
                    "text": translated_text,
                    "native_name": lang_info["native"],
                    "language_code": lang_code
                }
                
            except Exception as e:
                errors.append(f"{lang_info['name']}: {str(e)}")
        
        return {
            "success": len(translations) > 0,
            "original": text,
            "translations": translations,
            "errors": errors if errors else None,
            "model": "Local Helsinki-NLP (fallback)",
            "audio_enabled": False
        }
        
    except ImportError:
        return {
            "success": False,
            "original": text,
            "translations": {},
            "error": "No translation services available. Install: pip install transformers torch sentencepiece"
        }


def get_supported_languages():
    result = {}
    for code, info in SUPPORTED_LANGUAGES.items():
        result[code] = {
            "name": info["name"],
            "native_name": info["native"],
            "gtts_code": info.get("gtts_code", code)
        }
    return result


def get_languages_grouped():
    indian_langs = []
    world_langs = []
    
    for code, info in SUPPORTED_LANGUAGES.items():
        lang_obj = {
            "code": code,
            "name": info["name"],
            "native_name": info["native"],
            "gtts_code": info.get("gtts_code", code)
        }
        
        if code in ["hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "ur"]:
            indian_langs.append(lang_obj)
        else:
            world_langs.append(lang_obj)
    
    indian_langs.sort(key=lambda x: x["name"])
    world_langs.sort(key=lambda x: x["name"])
    
    return {
        "indian_languages": indian_langs,
        "world_languages": world_langs,
        "total_count": len(SUPPORTED_LANGUAGES)
    }


def get_language_info(lang_code):
    if lang_code in SUPPORTED_LANGUAGES:
        info = SUPPORTED_LANGUAGES[lang_code]
        return {
            "code": lang_code,
            "name": info["name"],
            "native_name": info["native"],
            "gtts_code": info.get("gtts_code", lang_code),
            "supported": True
        }
    return {
        "code": lang_code,
        "supported": False
    }
