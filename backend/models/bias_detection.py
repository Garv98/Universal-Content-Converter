import re
from transformers import pipeline

# Optional spaCy
try:
    import spacy
    from spacy.matcher import DependencyMatcher
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("⚠️ spaCy not available - using transformer models only")

_bias_model = None
_toxicity_model = None
_sentiment_model = None
_nlp = None

BIAS_PATTERNS = {
    "gender": {
        "patterns": [
            r'\b(mankind|manmade|chairman|fireman|policeman|stewardess|waitress|salesman|mailman)\b',
            r'\b(he|him|his)\s+(is|was|should be)\s+(a\s+)?(leader|engineer|scientist|boss|doctor|pilot)\b',
            r'\b(she|her)\s+(is|was)\s+(a\s+)?(nurse|assistant|secretary|teacher|housewife)\b',
            r'\b(men|women)\s+are\s+(better|worse)\s+at\s+\w+',
        ],
        "suggestions": {
            "mankind": "humankind",
            "manmade": "artificial",
            "chairman": "chairperson",
            "fireman": "firefighter",
            "policeman": "police officer",
            "stewardess": "flight attendant",
            "waitress": "server",
            "salesman": "salesperson",
            "mailman": "mail carrier",
        }
    },
    "age": {
        "patterns": [
            r'\b(old people|elderly|senior citizens?|boomers|past generations?)\b.*\b(slow|confused|forgetful|outdated|tech-illiterate|resistant to change)\b',
            r'\b(young people|young professionals|millennials?|gen z|gen y|zoomers|current generation|today\'s youth|today\'s workers)\b.*\b(lazy|naive|entitled|snowflakes|addicted to phones|spoiled|overly focused on|instant rewards|minimal sacrifice|reject proven|no commitment|demand constant|flexible hours|rapid success)\b',
            r'\b(unlike past generations?)\b.*\b(respected hard work|committed to lifelong|valued discipline)\b',
            r'\b(return to traditional|stop indulging|crumble standards)\b.*\b(entitled attitudes|every demand)\b',
            r'\b(too old|too young)\s+(for|to)\s+\w+',
        ],
        "suggestions": {
            "old people": "older adults",
            "elderly": "older adults",
            "senior citizen": "older adult",
            "boomers": "older generations",
            "past generations": "previous generations",
            "young people": "younger individuals",
            "young professionals": "early-career professionals",
            "millennial": "young adult",
            "gen z": "young adult",
            "zoomers": "younger generations",
            "current generation": "contemporary professionals",
            "today's youth": "younger generations",
            "entitled": "high expectations",
            "instant rewards": "quick feedback",
            "minimal sacrifice": "balanced effort",
            "reject proven practices": "innovate on established methods",
            "flexible hours": "work-life balance",
            "constant praise": "regular recognition",
            "entitled attitudes": "aspirational mindsets",
        }
    },
    "disability": {
        "patterns": [
            r'\b(crippled|handicapped|retarded|insane|crazy|psycho|lame|dumb|blind to|deaf to)\b',
            r'\b(suffers from|victim of|afflicted with)\b.*\b(disability|condition|illness)\b',
            r'\b(wheelchair-bound|confined to a wheelchair)\b',
            r'\b(people with|person with|individuals with|those with)\s+(cognitive|mental|physical|intellectual|developmental)?\s*(disabilities|disability|challenges|impairments?)\b.*\b(cannot|can\'t|unable to|incapable of|not able to|should not|shouldn\'t|better off|kept out|excluded from)\b',
            r'\b(disabled people|disabled individuals|the disabled)\b.*\b(cannot|can\'t|unable to|less capable|not suitable|inappropriate for|burden|liability)\b',
            r'\b(for the sake of efficiency|for productivity|to maintain standards)\b.*\b(disability|disabled|cognitive|mental|physical)\b',
        ],
        "suggestions": {
            "handicapped": "person with a disability",
            "crippled": "person with a disability",
            "retarded": "person with intellectual disability",
            "insane": "person with mental health challenges",
            "crazy": "person with mental health challenges",
            "psycho": "person with mental health challenges",
            "suffers from": "lives with",
            "victim of": "has",
            "wheelchair-bound": "wheelchair user",
            "cannot contribute": "can contribute with appropriate support",
            "kept out": "supported to participate",
            "better off being": "deserves opportunity",
        }
    },
    "racial": {
        "patterns": [
            r'\b(illegal alien|illegals|wetback|thug|gangster|criminal)\b',
            r'\b(black|white|asian|hispanic|native)\s+(neighborhood|community|area)\b.*\b(dangerous|ghetto|poor|rich)\b',
            r'\b(all \w+ people are)\b.*\b(lazy|smart|criminal|terrorists)\b',
        ],
        "suggestions": {
            "illegal alien": "undocumented immigrant",
            "illegals": "undocumented people",
            "thug": "person",
            "gangster": "individual",
        }
    },
    "cultural": {
        "patterns": [
            r'\b(tradition(al)? values|respect for authority|stable communities|abandoning traditions|primitive cultures)\b',
            r'\b(progress should never come at the cost of cultural identity)\b',
            r'\b(our way of life|superior culture|inferior culture|backward society)\b',
            r'\b(assimilate or leave|go back to your country)\b',
        ],
        "suggestions": {
            "respect for authority": "respect for diverse perspectives",
            "abandoning traditions": "adapting traditions",
            "superior culture": "unique culture",
            "inferior culture": "different culture",
            "primitive cultures": "diverse cultures",
            "backward society": "evolving society",
        }
    },
    "socioeconomic": {
        "patterns": [
            r'\b(poor people|the poor|low-income families|welfare queens)\b.*\b(lazy|unmotivated|criminal|drain on society)\b',
            r'\b(rich people|the rich|wealthy|one percent)\b.*\b(greedy|selfish|out of touch|elitist)\b',
            r'\b(pull yourself up by your bootstraps)\b',
        ],
        "suggestions": {
            "poor people": "people experiencing poverty",
            "the poor": "people experiencing poverty",
            "low-income families": "families with limited financial resources",
            "welfare queens": "people receiving assistance",
            "rich people": "people with financial means",
            "the rich": "people with financial means",
            "one percent": "high-income individuals",
        }
    },
    "political": {
        "patterns": [
            r'\b(left-wing|right-wing|liberal|conservative|democrat|republican)\b.*\b(radical|extremist|irrational|traitors|sheeple)\b',
            r'\b(politicians|government)\b.*\b(always lie|never care|corrupt|deep state)\b',
            r'\b(fake news|mainstream media)\b.*\b(lies|propaganda)\b',
        ],
        "suggestions": {
            "left-wing": "progressive",
            "right-wing": "traditionalist",
            "liberal": "progressive",
            "conservative": "traditionalist",
            "fake news": "misinformation",
        }
    },
    "sexual_orientation": {
        "patterns": [
            r'\b(gay|lesbian|queer|homo|dyke|fag)\b.*\b(agenda|lifestyle|choice|perverted|sinful)\b',
            r'\b(straight people are normal)\b',
            r'\b(that\'s so gay)\b',
        ],
        "suggestions": {
            "homo": "gay person",
            "dyke": "lesbian person",
            "fag": "gay person",
            "agenda": "rights",
            "lifestyle": "orientation",
            "choice": "identity",
        }
    },
    "religion": {
        "patterns": [
            r'\b(muslim|christian|jewish|hindu|atheist)\b.*\b(terrorists|fanatics|superstitious|greedy|godless)\b',
            r'\b(all religions are)\b.*\b(evil|the same|oppressive)\b',
            r'\b(war on christmas|sharia law)\b',
        ],
        "suggestions": {
            "terrorists": "extremists",
            "fanatics": "extremists",
            "superstitious": "devout",
            "godless": "non-religious",
        }
    },
    "body_image": {
        "patterns": [
            r'\b(fat|skinny|obese|anorexic)\b.*\b(lazy|ugly|unhealthy|disgusting)\b',
            r'\b(real women have curves|men should be muscular)\b',
            r'\b(body positivity is promoting obesity)\b',
        ],
        "suggestions": {
            "fat": "person with larger body",
            "skinny": "person with smaller body",
            "obese": "person with obesity",
            "anorexic": "person with eating disorder",
        }
    },
    "environmental": {
        "patterns": [
            r'\b(climate change is a hoax|environmentalists are extremists)\b',
            r'\b(green energy is a scam|tree huggers)\b',
        ],
        "suggestions": {
            "hoax": "debated issue",
            "extremists": "advocates",
            "scam": "initiative",
            "tree huggers": "environmentalists",
        }
    }
}


def detect_gender_role_bias(doc):
    """Detect gender role stereotyping using dependency parsing (requires spaCy)"""
    if not SPACY_AVAILABLE:
        return []
    
    matcher = DependencyMatcher(doc.vocab)

    pattern = [
        {
            "RIGHT_ID": "subject",
            "RIGHT_ATTRS": {"LOWER": {"IN": ["women", "woman", "men", "man", "females", "males"]}}
        },
        {
            "RIGHT_ID": "better",
            "LEFT_ID": "subject",
            "REL_OP": ">",
            "RIGHT_ATTRS": {"LOWER": {"IN": ["better", "suited", "more", "naturally", "tend"]}}
        },
        {
            "RIGHT_ID": "role",
            "LEFT_ID": "better",
            "REL_OP": ">",
            "RIGHT_ATTRS": {"LOWER": {"IN": ["roles", "positions", "jobs", "suited"]}}
        }
    ]

    matcher.add("GENDER_ROLE_BIAS", [pattern])

    matches = matcher(doc)
    flags = []

    for match_id, token_ids in matches:
        span_tokens = [doc[i] for i in token_ids]
        span_text = " ".join(t.text for t in span_tokens)
        flags.append({
            "type": "gender_role_stereotype",
            "severity": "high",
            "matched_text": span_text,
            "confidence": 0.92,
            "explanation": "Gender stereotyped role assignment detected"
        })

    if re.search(r'(emotional|feelings|hormonal).*(interfere|affect|weaken|lower).*(decision|strategic|logical|rational)', doc.text.lower()):
        flags.append({
            "type": "gender_emotion_stereotype",
            "severity": "high",
            "matched_text": "emotional ... interfere ... strategic",
            "confidence": 0.88,
            "explanation": "Emotional vs logical gender stereotype detected"
        })

    return flags


def load_bias_model():
    """Load hate speech detection model"""
    global _bias_model
    if _bias_model is None:
        print("Loading bias detection model...")
        _bias_model = pipeline(
            "text-classification",
            model="cardiffnlp/twitter-roberta-base-hate-latest",
            top_k=None
        )
        print("Bias detection model loaded successfully!")
    return _bias_model


def load_toxicity_model():
    """Load additional toxicity/bias model for enhanced detection"""
    global _toxicity_model
    if _toxicity_model is None:
        print("Loading toxicity detection model...")
        _toxicity_model = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            top_k=None
        )
        print("Toxicity detection model loaded successfully!")
    return _toxicity_model


def load_sentiment_model():
    """Load sentiment analysis model"""
    global _sentiment_model
    if _sentiment_model is None:
        print("Loading sentiment analysis model...")
        _sentiment_model = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest"
        )
        print("Sentiment analysis model loaded successfully!")
    return _sentiment_model


def load_nlp():
    """Load spaCy NLP model (optional - for enhanced detection)"""
    global _nlp
    if not SPACY_AVAILABLE:
        return None
    if _nlp is None:
        try:
            print("Loading spaCy NLP model...")
            _nlp = spacy.load("en_core_web_sm")
            print("spaCy NLP model loaded successfully!")
        except Exception as e:
            print(f"⚠️ Could not load spaCy model: {e}")
            print("Continuing with transformer models only...")
            return None
    return _nlp


def detect_bias(text):
    """
    Main bias detection function using multiple models and techniques.
    
    Returns comprehensive bias analysis with scores, categories, and suggestions.
    """
    if not text or not text.strip():
        return {"success": False, "error": "No text provided"}

    results = {
        "success": True,
        "overall_bias_detected": False,
        "bias_score": 100.0,
        "categories": [],
        "flags": [],
        "suggestions": [],
        "detailed_report": ""
    }

    rb = _rule_based_bias_detection(text)
    results["flags"].extend(rb["flags"])
    results["suggestions"].extend(rb["suggestions"])
    results["categories"].extend(rb["categories"])

    sentences = re.split(r'(?<=[.!?])\s+', text)
    bias_scores = []
    toxicity_scores = []

    hate_model = load_bias_model()
    toxicity_model = load_toxicity_model()
    hate_preds = hate_model(sentences)
    toxicity_preds = toxicity_model(sentences)

    for idx, (hate_pred, tox_pred, sent) in enumerate(zip(hate_preds, toxicity_preds, sentences)):
        for p in hate_pred:
            if p["label"].lower() in ["label_1", "hate"] and p["score"] > 0.4:  #Lowered from 0.5
                bias_scores.append(p["score"])
                results["flags"].append({
                    "type": "ml_hate",
                    "severity": "high" if p["score"] > 0.7 else "medium",
                    "text": sent,
                    "confidence": round(p["score"], 2)
                })
                if "hate" not in results["categories"]:
                    results["categories"].append("hate")

        for p in tox_pred:
            if p["label"] == "toxic" and p["score"] > 0.4:  #Lowered from 0.5
                toxicity_scores.append(p["score"])
                results["flags"].append({
                    "type": "ml_toxicity",
                    "severity": "high" if p["score"] > 0.7 else "medium",
                    "text": sent,
                    "confidence": round(p["score"], 2)
                })
                if "toxicity" not in results["categories"]:
                    results["categories"].append("toxicity")

    #if spacy- enhanced contextual NLP detection
    nlp = load_nlp()
    contextual_flags = 0
    
    if nlp is not None:
        doc = nlp(text)
        sentiment_model = load_sentiment_model()

        entity_bias_keywords = {
            'PERSON': ['stereotype', 'bias'],
            'NORP': ['nationality', 'religion', 'politics', 'generation'],
            'GPE': ['country', 'location'],
            'DATE': ['young', 'old', 'generation', 'past', 'today']
        }

        age_patterns = [
            r'\b(young|millennial|gen z|current|today\'s)\b',
            r'\b(past|previous|older)\s+generation',
        ]

        for sent in doc.sents:
            entities = [(ent.text, ent.label_) for ent in sent.ents if ent.label_ in ['PERSON', 'NORP', 'ORG', 'GPE', 'DATE']]
            has_age_context = any(re.search(pattern, sent.text.lower()) for pattern in age_patterns)
            if entities or has_age_context:
                sentiment = sentiment_model(sent.text)[0]
                if sentiment['label'] == 'LABEL_0' and sentiment['score'] > 0.5:
                    has_bias_context = any(any(kw in sent.text.lower() for kw in entity_bias_keywords.get(label, [])) for _, label in entities)
                    if has_age_context:
                        has_bias_context = True
                    severity = "high" if has_bias_context and sentiment['score'] > 0.7 else "medium"
                    results["flags"].append({
                        "type": "contextual_bias",
                        "matched_text": sent.text.strip(),
                        "severity": severity,
                        "entities": [e[0] for e in entities] + (["age_context"] if has_age_context else []),
                        "confidence": round(sentiment['score'], 2)
                    })
                    category = "contextual_age" if has_age_context else "contextual"
                    if category not in results["categories"]:
                        results["categories"].append(category)
                    contextual_flags += 1

        if SPACY_AVAILABLE:
            gender_flags = detect_gender_role_bias(doc)
            if gender_flags:
                results["flags"].extend(gender_flags)
                if "gender" not in results["categories"]:
                    results["categories"].append("gender")
                contextual_flags += len(gender_flags)

    results["categories"] = list(set(results["categories"]))

    total_flags = len(results["flags"])
    if total_flags > 0:
        avg_bias = sum(bias_scores) / len(bias_scores) if bias_scores else 0
        avg_tox = sum(toxicity_scores) / len(toxicity_scores) if toxicity_scores else 0
        contextual_age_flags = sum(1 for c in results["categories"] if "age" in c)
        penalty = (avg_bias * 25) + (avg_tox * 25) + (contextual_flags * 20) + (contextual_age_flags * 10) + (len(rb["flags"]) * 8)
        results["bias_score"] = max(0, round(100 - penalty, 1))
    else:
        results["bias_score"] = 100.0

    results["overall_bias_detected"] = total_flags > 0
    results["detailed_report"] = _generate_bias_report(results)

    return results


def _rule_based_bias_detection(text):
    """Rule-based pattern matching for known bias indicators"""
    flags, suggestions, categories = [], [], []
    text_lower = text.lower()

    for bias_type, config in BIAS_PATTERNS.items():
        for pattern in config["patterns"]:
            matches = list(re.finditer(pattern, text_lower))
            for match in matches:
                matched = match.group(0)
                flag_type = f"{bias_type}_generational" if bias_type == "age" and "generation" in matched else bias_type
                flags.append({
                    "type": flag_type,
                    "matched_text": matched,
                    "severity": "high" if bias_type in ["disability", "racial", "sexual_orientation", "religion", "age"] else "medium"
                })
                if flag_type not in categories:
                    categories.append(flag_type)

                for term, repl in config.get("suggestions", {}).items():
                    if re.search(re.escape(term), matched, re.IGNORECASE):
                        suggested = re.sub(re.escape(term), repl, matched, flags=re.IGNORECASE)
                        suggestions.append({
                            "original": matched,
                            "suggested": suggested,
                            "type": bias_type
                        })
                        break

    return {
        "flags": flags,
        "suggestions": suggestions,
        "categories": list(set(categories))
    }


def _generate_bias_report(results):
    """Generate a comprehensive, professional bias analysis report"""
    if not results["overall_bias_detected"]:
        return "✓ No significant bias detected. Content appears inclusive and balanced."

    lines = [
        "═══════════════════════════════════════════════════════════════",
        "           PROFESSIONAL BIAS ANALYSIS REPORT",
        "═══════════════════════════════════════════════════════════════",
        "",
        f"Overall Bias Score: {results['bias_score']}% (100% = No Bias Detected)",
        f"Bias Status: {'⚠️ DETECTED' if results['bias_score'] < 70 else '⚠️ MINOR ISSUES DETECTED'}",
        f"Categories Identified: {', '.join(results['categories']) if results['categories'] else 'None'}",
        f"Total Issues Found: {len(results['flags'])}",
        "",
        "───────────────────────────────────────────────────────────────",
        "DETAILED BREAKDOWN BY CATEGORY",
        "───────────────────────────────────────────────────────────────",
    ]

    category_counts = {}
    for flag in results["flags"]:
        cat = flag["type"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
        lines.append(f"  • {cat.replace('_', ' ').title()}: {count} issue(s)")

    lines.append("")
    lines.append("───────────────────────────────────────────────────────────────")
    lines.append("PRIORITY ISSUES (Sorted by Severity & Confidence)")
    lines.append("───────────────────────────────────────────────────────────────")
    
    for i, flag in enumerate(sorted(results["flags"], key=lambda x: (x.get("severity", "") == "high", x.get("confidence", 0)), reverse=True)[:10], 1):
        text_key = "text" if "text" in flag else "matched_text"
        severity_icon = "🔴" if flag['severity'] == "high" else "🟡"
        lines.append(f"{i}. {severity_icon} [{flag['type'].replace('_', ' ').upper()}]")
        lines.append(f"   Text: \"{flag[text_key]}\"")
        lines.append(f"   Severity: {flag['severity'].upper()} | Confidence: {flag.get('confidence', 'N/A')}")
        if flag.get('explanation'):
            lines.append(f"   Explanation: {flag['explanation']}")
        lines.append("")

    if results["suggestions"]:
        lines.append("───────────────────────────────────────────────────────────────")
        lines.append("RECOMMENDED IMPROVEMENTS")
        lines.append("───────────────────────────────────────────────────────────────")
        seen_sugs = set()
        suggestion_count = 0
        for sug in results["suggestions"]:
            key = (sug['original'], sug['type'])
            if key not in seen_sugs:
                suggestion_count += 1
                lines.append(f"{suggestion_count}. Replace: \"{sug['original']}\"")
                lines.append(f"   With: \"{sug['suggested']}\"")
                lines.append(f"   Category: {sug['type'].title()}")
                lines.append("")
                seen_sugs.add(key)
            if len(seen_sugs) >= 10:
                break

    lines.append("═══════════════════════════════════════════════════════════════")
    lines.append("PROFESSIONAL RECOMMENDATIONS")
    lines.append("═══════════════════════════════════════════════════════════════")
    
    if any("age" in cat or "generational" in cat for cat in results["categories"]):
        lines.append("⚠️  GENERATIONAL BIAS DETECTED:")
        lines.append("   • Avoid sweeping generalizations about age groups")
        lines.append("   • Promote balanced perspectives on work ethic across generations")
        lines.append("   • Encourage empathy and understanding of diverse experiences")
        lines.append("   • Focus on individual merit rather than age-based stereotypes")
        lines.append("")
    
    if any("gender" in cat for cat in results["categories"]):
        lines.append("⚠️  GENDER BIAS DETECTED:")
        lines.append("   • Use gender-neutral language where possible")
        lines.append("   • Avoid reinforcing traditional gender role stereotypes")
        lines.append("   • Consider using inclusive pronouns (they/them)")
        lines.append("")
    
    lines.append("📋 GENERAL BEST PRACTICES:")
    lines.append("   • Review content for implicit assumptions about demographic groups")
    lines.append("   • Seek diverse perspectives in content creation and review")
    lines.append("   • Focus on individual qualities rather than group stereotypes")
    lines.append("   • Use person-first language when discussing characteristics")
    lines.append("")
    lines.append("═══════════════════════════════════════════════════════════════")

    return "\n".join(lines)
