import os
import tempfile


def extract_text_from_pdf(pdf_file):
    try:
        import pdfplumber
        
        temp_path = None
        if hasattr(pdf_file, 'save'):
            temp_path = tempfile.mktemp(suffix='.pdf')
            pdf_file.save(temp_path)
            pdf_file.seek(0)
        else:
            temp_path = pdf_file
        
        extracted_text = []
        with pdfplumber.open(temp_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    extracted_text.append(f"--- Page {page_num} ---\n{text}")
        
        if temp_path and os.path.exists(temp_path) and hasattr(pdf_file, 'save'):
            os.remove(temp_path)
        
        full_text = "\n\n".join(extracted_text)
        
        return {
            "success": True,
            "text": full_text,
            "page_count": len(extracted_text),
            "method": "pdfplumber"
        }
        
    except ImportError:
        return _extract_with_pypdf2(pdf_file)
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "method": "pdfplumber"
        }


def _extract_with_pypdf2(pdf_file):
    """fallback PDF extraction using PyPDF2"""
    try:
        from PyPDF2 import PdfReader
        
        reader = PdfReader(pdf_file)
        extracted_text = []
        
        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text:
                extracted_text.append(f"--- Page {page_num} ---\n{text}")
        
        return {
            "success": True,
            "text": "\n\n".join(extracted_text),
            "page_count": len(extracted_text),
            "method": "PyPDF2"
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "method": "PyPDF2"
        }


def extract_text_from_image(image_file):
    try:
        from PIL import Image
        import tempfile
        
        temp_path = tempfile.mktemp(suffix='.png')
        if hasattr(image_file, 'save'):
            image_file.save(temp_path)
            image_file.seek(0)
        else:
            temp_path = image_file
        
        image = Image.open(temp_path)
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        extracted_text = _extract_with_trocr(image)
        
        from .image_captioning import generate_alt_text
        caption_result = generate_alt_text(temp_path)
        
        if os.path.exists(temp_path) and hasattr(image_file, 'save'):
            os.remove(temp_path)
        
        if not extracted_text or len(extracted_text.strip()) < 5:
            main_text = f"Image Description: {caption_result.get('alt_text', '')}"
            method = "blip_image_captioning"
            note = "No readable text found in image. Generated description instead."
        else:
            main_text = extracted_text.strip()
            method = "trocr_transformers"
            note = None
        
        result = {
            "success": True,
            "text": main_text,
            "method": method,
            "source": "image_ocr"
        }
        
        if note:
            result["note"] = note
        
        if caption_result.get("success"):
            result.update({
                "alt_text": caption_result.get("alt_text"),
                "raw_caption": caption_result.get("raw_caption"),
                "brief_caption": caption_result.get("raw_caption"),
                "detailed_caption": caption_result.get("detailed_caption"),
                "enhanced_description": caption_result.get("enhanced_description"),
                "ocr_text": caption_result.get("ocr_text"),
                "all_captions": caption_result.get("all_captions"),
                "image_info": caption_result.get("image_info"),
                "model": caption_result.get("model"),
                "confidence": caption_result.get("confidence", 0.95)
            })
        
        return result
        
    except ImportError as e:
        return {
            "success": False,
            "text": "",
            "error": f"Missing dependency: {str(e)}. Install with: pip install transformers torch pillow",
            "method": "trocr_transformers"
        }
    except Exception as e:
        return {
            "success": False,
            "text": "",
            "error": str(e),
            "method": "trocr_transformers"
        }


def _extract_with_trocr(image):
    try:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        
        model_name = "microsoft/trocr-base-printed"
        
        print(f"Loading TrOCR model: {model_name}...")
        processor = TrOCRProcessor.from_pretrained(model_name)
        model = VisionEncoderDecoderModel.from_pretrained(model_name)
        
        pixel_values = processor(image, return_tensors="pt").pixel_values
        generated_ids = model.generate(pixel_values)
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        return generated_text
        
    except Exception as e:
        print(f"TrOCR extraction failed: {e}")
        return ""

