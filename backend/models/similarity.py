
_similarity_model = None


def load_similarity_model():
    global _similarity_model
    
    if _similarity_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            
            model_name = "all-MiniLM-L6-v2"
            print(f"Loading similarity model: {model_name}...")
            
            _similarity_model = SentenceTransformer(model_name)
            print("Similarity model loaded successfully!")
            
        except Exception as e:
            print(f"Error loading similarity model: {e}")
            return None
    
    return _similarity_model


def compute_similarity(text1, text2):
    if not text1 or not text2:
        return {
            "success": False,
            "score": 0,
            "error": "Both texts are required"
        }
    
    try:
        model = load_similarity_model()
        
        if model is None:
            return _fallback_similarity(text1, text2)
        
        from sentence_transformers import util
        
        embedding1 = model.encode(text1, convert_to_tensor=True)
        embedding2 = model.encode(text2, convert_to_tensor=True)
        
        similarity = util.cos_sim(embedding1, embedding2).item()
        score = round(similarity, 4)
        
        return {
            "success": True,
            "score": score,
            "percentage": round(score * 100, 1),
            "interpretation": _interpret_similarity(score),
            "model": "all-MiniLM-L6-v2"
        }
        
    except ImportError:
        return _fallback_similarity(text1, text2)
    except Exception as e:
        return {
            "success": False,
            "score": 0,
            "error": str(e)
        }


def compute_batch_similarity(reference_text, comparison_texts):
    try:
        model = load_similarity_model()
        
        if model is None:
            return {"success": False, "error": "Model not available"}
        
        from sentence_transformers import util
        
        ref_embedding = model.encode(reference_text, convert_to_tensor=True)
        comp_embeddings = model.encode(comparison_texts, convert_to_tensor=True)
        
        similarities = util.cos_sim(ref_embedding, comp_embeddings)[0]
        
        results = []
        for i, text in enumerate(comparison_texts):
            score = similarities[i].item()
            results.append({
                "text": text[:100] + "..." if len(text) > 100 else text,
                "score": round(score, 4),
                "interpretation": _interpret_similarity(score)
            })
        
        return {
            "success": True,
            "reference": reference_text[:100] + "..." if len(reference_text) > 100 else reference_text,
            "comparisons": results
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}


def _interpret_similarity(score):
    if score >= 0.9:
        return "Excellent - Nearly identical meaning"
    elif score >= 0.8:
        return "Very High - Meaning well preserved"
    elif score >= 0.7:
        return "High - Most meaning preserved"
    elif score >= 0.6:
        return "Moderate - Some meaning preserved"
    elif score >= 0.5:
        return "Low - Significant meaning change"
    else:
        return "Very Low - Meaning substantially different"


def _fallback_similarity(text1, text2):
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return {"success": False, "score": 0, "error": "Empty text"}
    
    intersection = len(words1 & words2)
    union = len(words1 | words2)
    
    score = intersection / union if union > 0 else 0
    
    return {
        "success": True,
        "score": round(score, 4),
        "percentage": round(score * 100, 1),
        "interpretation": _interpret_similarity(score),
        "model": "jaccard-fallback",
        "note": "Install sentence-transformers for better accuracy"
    }
