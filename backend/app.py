from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from models.text_extraction import extract_text_from_pdf, extract_text_from_image
from models.simplification import simplify_text
from models.translation import translate_text
from models.similarity import compute_similarity
from models.bias_detection import detect_bias
from models.wcag_checker import check_wcag_compliance
from models.sign_language import generate_gloss
from models.image_captioning import generate_alt_text
from models.speech_to_text import transcribe_audio
from models.video_processing import process_video_for_accessibility, transcribe_video

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500MB max for video uploads


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "UDL Backend is running",
        "models": {
            "text_extraction": "ready",
            "simplification": "ready",
            "translation": "ready",
            "similarity": "ready",
            "bias_detection": "ready",
            "wcag_checker": "ready",
            "sign_language": "ready",
            "image_captioning": "Florence-2 + Groq",
            "speech_to_text": "ready",
            "video_processing": "ready"
        }
    })


@app.route("/process", methods=["POST"])
def process_all():
    """Main endpoint that processes all UDL transformations"""
    try:
        text_content = ""
        image_file = None
        audio_file = None
        pdf_file = None

        if request.is_json:
            data = request.get_json()
            text_content = data.get("text", "")
        else:
            text_content = request.form.get("text", "")
            
            if "image" in request.files:
                image_file = request.files["image"]
            if "audio" in request.files:
                audio_file = request.files["audio"]
            if "pdf" in request.files:
                pdf_file = request.files["pdf"]

        extracted_text = text_content
        
        if pdf_file and pdf_file.filename:
            pdf_result = extract_text_from_pdf(pdf_file)
            if pdf_result.get("success"):
                extracted_text = pdf_result.get("text", "")
        
        if image_file and image_file.filename and not extracted_text:
            ocr_result = extract_text_from_image(image_file)
            if ocr_result.get("success"):
                extracted_text = ocr_result.get("text", "")

        if audio_file and audio_file.filename and not extracted_text:
            audio_result = transcribe_audio(audio_file)
            if audio_result.get("success"):
                extracted_text = audio_result.get("transcript", "")

        simplification_result = simplify_text(extracted_text)
        simplified_text = simplification_result.get("simplified", extracted_text)
        
        results = {
            "extraction": {
                "text": extracted_text,
                "source": "pdf" if pdf_file else "image" if image_file else "audio" if audio_file else "direct"
            },
            "simplification": simplification_result,
            "translation": translate_text(simplified_text),
            "similarity": compute_similarity(extracted_text, simplified_text),
            "bias": detect_bias(extracted_text),
            "wcag": check_wcag_compliance(extracted_text),
            "signlanguage": generate_gloss(simplified_text),
        }
        
        if image_file and image_file.filename:
            image_file.seek(0)
            results["alttext"] = generate_alt_text(image_file)
        
        if audio_file and audio_file.filename:
            audio_file.seek(0)
            results["transcript"] = transcribe_audio(audio_file)

        return jsonify({"success": True, "results": results})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/extraction", methods=["POST"])
def process_extraction():
    """Extract text from uploaded files"""
    try:
        if request.files:
            text = request.form.get("text", "")
            
            if "pdf" in request.files:
                pdf_file = request.files["pdf"]
                if pdf_file.filename:
                    print(f"📄 Processing PDF: {pdf_file.filename}")
                    result = extract_text_from_pdf(pdf_file)
                else:
                    result = {"success": True, "text": text, "source": "direct_input"}
            elif "image" in request.files:
                image_file = request.files["image"]
                if image_file.filename:
                    print(f"🖼️ Processing Image: {image_file.filename}")
                    result = extract_text_from_image(image_file)
                else:
                    result = {"success": True, "text": text, "source": "direct_input"}
            elif "audio" in request.files:
                audio_file = request.files["audio"]
                if audio_file.filename:
                    print(f"🎤 Processing Audio: {audio_file.filename}")
                    result = transcribe_audio(audio_file)
                else:
                    result = {"success": True, "text": text, "source": "direct_input"}
            else:
                result = {"success": True, "text": text, "source": "direct_input"}
        elif request.content_type and 'application/json' in request.content_type:
            data = request.get_json() or {}
            text = data.get("text", "")
            result = {"success": True, "text": text, "source": "direct_input"}
        else:
            text = request.form.get("text", "") or request.values.get("text", "")
            result = {"success": True, "text": text, "source": "direct_input"}
        
        print(f"✅ Extraction complete: {len(result.get('text', ''))} characters")
        return jsonify({"success": True, "result": result})
    except Exception as e:
        print(f"❌ Extraction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/simplification", methods=["POST"])
def process_simplification():
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        result = simplify_text(text)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/translation", methods=["POST"])
def process_translation():
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        languages = data.get("languages", ["hi", "es", "fr", "de"]) 
        include_audio = data.get("include_audio", True) 
        
        result = translate_text(text, languages, include_audio)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/translate/single", methods=["POST"])
def translate_single():
    """Translate text to a single language on-demand with audio"""
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        language = data.get("language", "hi")
        include_audio = data.get("include_audio", True)
        
        result = translate_text(text, [language], include_audio)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/languages", methods=["GET"])
def get_languages():
    try:
        from models.translation import get_supported_languages
        languages = get_supported_languages()
        return jsonify({"success": True, "languages": languages})
    except Exception as e:
        print(f"❌ Error getting languages: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/languages/grouped", methods=["GET"])
def get_languages_grouped_endpoint():
    try:
        from models.translation import get_languages_grouped
        result = get_languages_grouped()
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/language/<lang_code>", methods=["GET"])
def get_language_info_endpoint(lang_code):
    try:
        from models.translation import get_language_info
        info = get_language_info(lang_code)
        return jsonify({"success": True, "language": info})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/similarity", methods=["POST"])
def process_similarity():
    try:
        data = request.get_json() or {}
        original = data.get("original", "")
        simplified = data.get("simplified", "")
        result = compute_similarity(original, simplified)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/bias", methods=["POST"])
def process_bias():
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        result = detect_bias(text)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/wcag", methods=["POST"])
def process_wcag():
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        html = data.get("html", None)
        result = check_wcag_compliance(text, html)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/signlanguage", methods=["POST"])
def process_sign_language():
    try:
        data = request.get_json() or {}
        text = data.get("text", "")
        result = generate_gloss(text)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/alttext", methods=["POST", "OPTIONS"])
def process_alt_text():
    if request.method == "OPTIONS":
        return "", 200
    
    try:
        print("🖼️ Alt text endpoint called!")
        print(f"📁 Files in request: {list(request.files.keys())}")
        
        if "image" not in request.files:
            print("❌ No 'image' field in request.files")
            return jsonify({"success": False, "error": "No image provided"}), 400
        
        image_file = request.files["image"]
        print(f"📷 Processing image: {image_file.filename}")
        
        result = generate_alt_text(image_file)
        print(f"✅ Alt text result: {result.get('alt_text', 'N/A')[:100]}...")
        
        return jsonify({"success": True, "result": result})
    except Exception as e:
        print(f"❌ Alt text error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/transcript", methods=["POST"])
def process_transcript():
    try:
        if "audio" not in request.files:
            return jsonify({"success": False, "error": "No audio provided"}), 400
        
        audio_file = request.files["audio"]
        language = request.form.get("language", "en") 
        result = transcribe_audio(audio_file, language)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/video", methods=["POST"])
def process_video():
    temp_path = None
    try:
        if "video" not in request.files:
            return jsonify({"success": False, "error": "No video provided"}), 400
        
        video_file = request.files["video"]
        
        if not video_file.filename:
            return jsonify({"success": False, "error": "Empty video file"}), 400
        
        import tempfile
        import time
        temp_path = tempfile.mktemp(suffix=os.path.splitext(video_file.filename)[1])
        video_file.save(temp_path)
        
        print(f"🎬 Processing video: {video_file.filename}")
        
        result = process_video_for_accessibility(temp_path)
        
        time.sleep(0.5)
        
        if temp_path and os.path.exists(temp_path):
            for _ in range(3):
                try:
                    os.remove(temp_path)
                    break
                except PermissionError:
                    time.sleep(0.5)
        
        return jsonify({"success": result.get("success", False), "result": result})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        if temp_path and os.path.exists(temp_path):
            try:
                import time
                time.sleep(0.5)
                os.remove(temp_path)
            except:
                pass
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/process/video/captions", methods=["POST"])
def get_video_captions():
    try:
        if "video" not in request.files:
            return jsonify({"success": False, "error": "No video provided"}), 400
        
        video_file = request.files["video"]
        
        import tempfile
        temp_path = tempfile.mktemp(suffix=os.path.splitext(video_file.filename)[1])
        video_file.save(temp_path)
        
        result = transcribe_video(temp_path)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        if result.get("success"):
            return jsonify({
                "success": True,
                "captions": result.get("captions", []),
                "vtt_content": result.get("vtt_content", ""),
                "speaker_segments": result.get("speaker_segments", []),
                "duration": result.get("duration", 0)
            })
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("Universal UDL Converter - Flask Backend")
    print("=" * 60)
    print("Server running at: http://localhost:8000")
    print("Health check: http://localhost:8000/health")
    print("=" * 60)
    app.run(host="0.0.0.0", port=8000, debug=True)
