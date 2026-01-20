import os
import tempfile
import torch

_florence_processor = None
_florence_model = None

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

if DEVICE == "cpu":
    torch.set_num_threads(4)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")


def load_florence_model():
    """Load the Florence-2 model"""
    global _florence_processor, _florence_model
    
    if _florence_model is None:
        try:
            from transformers import AutoProcessor, AutoModelForCausalLM
            
            model_name = "microsoft/Florence-2-base"
            print(f"🖼️ Loading Florence-2 model: {model_name}...")
            
            _florence_processor = AutoProcessor.from_pretrained(
                model_name, 
                trust_remote_code=True
            )
            
            _florence_model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float32,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
                attn_implementation="eager"
            ).to(DEVICE).eval()
            
            print(f"✅ Florence-2 model loaded on {DEVICE}!")
            
        except Exception as e:
            print(f"❌ Error loading Florence-2 model: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    return _florence_processor, _florence_model


def generate_florence_caption(image, task="<DETAILED_CAPTION>"):
    """
    Generate caption using Florence-2 model.
    
    Tasks:
    - <CAPTION>: Brief caption
    - <DETAILED_CAPTION>: Detailed caption
    - <MORE_DETAILED_CAPTION>: Very detailed caption
    - <OCR>: Extract text from image
    """
    processor, model = load_florence_model()
    if model is None:
        return None
    
    try:
        inputs = processor(text=task, images=image, return_tensors="pt")
        
        input_ids = inputs["input_ids"].to(DEVICE)
        pixel_values = inputs["pixel_values"].to(DEVICE)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=input_ids,
                pixel_values=pixel_values,
                max_new_tokens=512,
                num_beams=3,
                do_sample=False,
                use_cache=False
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        
        parsed = processor.post_process_generation(generated_text, task=task, image_size=image.size)
        
        if isinstance(parsed, dict):
            caption = parsed.get(task, generated_text)
        else:
            caption = str(parsed)
        
        caption = str(caption).strip()
        
        return caption
        
    except Exception as e:
        print(f"❌ Error generating Florence caption: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_groq_description(caption, image_base64=None):
    if not GROQ_API_KEY:
        print("⚠️ GROQ_API_KEY not set, skipping detailed description")
        return None
    
    try:
        from groq import Groq
        
        client = Groq(api_key=GROQ_API_KEY)
        
        prompt = f"""Based on this image caption, explain what this image represents or depicts for someone who cannot see it.

Caption: {caption}

Requirements:
1. Focus on WHAT the image shows (the subject, concept, or content)
2. Explain the purpose or meaning of what's depicted
3. If it's a diagram, chart, or technical image, explain what it demonstrates or illustrates
4. If it's a scene or object, describe what it is and its significance
5. Avoid describing visual features like colors, textures, spatial layout unless critical to understanding
6. Keep it clear and informative (2-4 sentences)
7. Use accessible language suitable for screen readers

Provide ONLY the description, no preamble or explanation."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at writing accessible image descriptions for visually impaired users. Your descriptions are clear, concise, and help users understand the visual content."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=300
        )
        
        description = response.choices[0].message.content.strip()
        return description
        
    except ImportError:
        print("⚠️ groq package not installed. Install with: pip install groq")
        return None
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        return None


def generate_alt_text(image_file, max_length=75, num_captions=1):
    temp_path = None
    pil_image = None
    width, height = None, None
    
    try:
        from PIL import Image
        
        print("🔍 Loading image for captioning...")
        
        if hasattr(image_file, 'save'):
            original_filename = getattr(image_file, 'filename', 'image.png')
            ext = os.path.splitext(original_filename)[1] or '.png'
            temp_path = tempfile.mktemp(suffix=ext)
            
            image_file.save(temp_path)
            image_file.seek(0)
            
            pil_image = Image.open(temp_path)
            print(f"✅ Image loaded from Flask upload: {original_filename}")
            
        elif hasattr(image_file, 'read'):
            pil_image = Image.open(image_file)
            print("✅ Image loaded from file-like object")
            
        elif isinstance(image_file, str):
            if os.path.exists(image_file):
                pil_image = Image.open(image_file)
                print(f"✅ Image loaded from path: {image_file}")
            else:
                print(f"❌ Image file not found: {image_file}")
                return {
                    "success": False,
                    "error": "Image file not found",
                    "alt_text": "Image"
                }
        else:
            pil_image = Image.open(image_file)
            print("✅ Image loaded directly")
        
        if pil_image.mode != 'RGB':
            print(f"🔄 Converting from {pil_image.mode} to RGB...")
            pil_image = pil_image.convert('RGB')
        
        width, height = pil_image.size
        print(f"📐 Image size: {width}x{height}")
        
        print("🖼️ Generating caption with Florence-2...")
        
        brief_caption = None
        detailed_caption = None
        ocr_result = None
        
        try:
            brief_caption = generate_florence_caption(pil_image, "<CAPTION>")
            print(f"📝 Brief caption: {brief_caption}")
        except Exception as e:
            print(f"⚠️ Brief caption failed: {e}")
        
        try:
            detailed_caption = generate_florence_caption(pil_image, "<DETAILED_CAPTION>")
            print(f"📝 Detailed caption: {detailed_caption}")
        except Exception as e:
            print(f"⚠️ Detailed caption failed: {e}")
        
        try:
            ocr_result = generate_florence_caption(pil_image, "<OCR>")
            if ocr_result:
                print(f"📝 OCR result: {ocr_result[:100]}...")
        except Exception as e:
            print(f"⚠️ OCR failed: {e}")
        
        if brief_caption or detailed_caption:
            main_caption = detailed_caption if detailed_caption else brief_caption
            print(f"✅ Florence-2 caption: {main_caption}")
            
            enhanced_description = None
            if GROQ_API_KEY:
                print("🤖 Getting Groq enhanced description...")
                enhanced_description = get_groq_description(main_caption)
                if enhanced_description:
                    print(f"✅ Groq description: {enhanced_description[:100]}...")
            
            alt_text = _format_for_accessibility(brief_caption if brief_caption else detailed_caption)
            
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            result = {
                "success": True,
                "alt_text": alt_text,
                "raw_caption": brief_caption,
                "detailed_caption": detailed_caption,
                "enhanced_description": enhanced_description,
                "ocr_text": ocr_result if ocr_result else None,
                "all_captions": [c for c in [brief_caption, detailed_caption] if c],
                "image_info": {
                    "width": width,
                    "height": height,
                    "aspect_ratio": round(width/height, 2) if height > 0 else 1
                },
                "model": "Florence-2-base + Groq Llama-3.1-8B" if enhanced_description else "Florence-2-base",
                "confidence": 0.95
            }
            
            print(f"✅ Returning alt text result with {len(result)} fields")
            return result
        
        print("⚠️ Florence-2 returned no captions, using fallback...")
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        return _basic_fallback(width, height)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return {
            "success": False,
            "error": f"Missing dependency: {str(e)}. Install with: pip install transformers torch pillow groq",
            "alt_text": "Image"
        }
    except Exception as e:
        print(f"❌ Error in generate_alt_text: {e}")
        import traceback
        traceback.print_exc()
        
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        
        return {
            "success": False,
            "error": str(e),
            "alt_text": "Image"
        }


def _basic_fallback(width=None, height=None):
    """Basic fallback when no ML model works"""
    return {
        "success": True,
        "alt_text": "Image",
        "note": "Install transformers and torch for AI-generated descriptions",
        "image_info": {
            "width": width,
            "height": height
        } if width and height else None,
        "model": "fallback"
    }


def _format_for_accessibility(caption):
    if not caption:
        return "Image"
    
    if isinstance(caption, dict):
        caption = str(caption)
    
    caption = caption[0].upper() + caption[1:] if len(caption) > 1 else caption.upper()
    
    caption = caption.replace("arafed ", "")
    caption = caption.replace("araffed ", "")
    caption = caption.replace("there is a ", "A ")
    caption = caption.replace("there are ", "")
    caption = caption.replace("  ", " ")
    caption = caption.strip()
    
    if caption and not caption[-1] in '.!?':
        caption += '.'
    
    return caption


def generate_detailed_description(image_file):
    result = generate_alt_text(image_file)
    
    if result["success"]:
        if result.get("enhanced_description"):
            result["detailed_description"] = result["enhanced_description"]
        elif result.get("detailed_caption"):
            result["detailed_description"] = result["detailed_caption"]
        else:
            result["detailed_description"] = result.get("alt_text", "")
    
    return result
