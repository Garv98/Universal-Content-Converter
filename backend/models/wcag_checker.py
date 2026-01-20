import re
from collections import defaultdict


def check_wcag_compliance(text, html_content=None):
    if not text or not text.strip():
        return {
            "success": False,
            "error": "No content provided for WCAG analysis"
        }
    
    results = {
        "success": True,
        "overall_score": 0,
        "wcag_level": "Fail",
        "compliance_by_level": {"A": 0, "AA": 0, "AAA": 0},
        "principle_scores": {
            "perceivable": 0,
            "operable": 0,
            "understandable": 0,
            "robust": 0
        },
        "checks": [],
        "issues": [],
        "recommendations": [],
        "detailed_report": ""
    }
    
    checks = []
    
    checks.append(_check_text_alternatives(text, html_content))
    checks.append(_check_captions_and_transcripts(text, html_content))
    checks.append(_check_adaptable_content(text, html_content))
    checks.append(_check_distinguishable_content(text))
    
    checks.append(_check_keyboard_accessible(html_content))
    checks.append(_check_enough_time(text))
    checks.append(_check_seizures_safety(html_content))
    checks.append(_check_navigable(html_content))
    checks.append(_check_input_modalities(html_content))
    
    checks.append(_check_readable(text))
    checks.append(_check_language_clarity(text))
    checks.append(_check_predictable(html_content))
    checks.append(_check_input_assistance(html_content))
    
    checks.append(_check_compatible(html_content))
    
    results["checks"] = checks
    
    by_principle = defaultdict(list)
    for check in checks:
        by_principle[check["principle"]].append(check["passed"])
    
    for principle, passed_list in by_principle.items():
        if passed_list:
            results["principle_scores"][principle] = round((sum(passed_list) / len(passed_list)) * 100)
    
    by_level = {"A": [], "AA": [], "AAA": []}
    for check in checks:
        level = check.get("level", "A")
        by_level[level].append(check["passed"])
    
    for level, passed_list in by_level.items():
        if passed_list:
            results["compliance_by_level"][level] = round((sum(passed_list) / len(passed_list)) * 100)
    
    if results["compliance_by_level"]["AAA"] >= 90:
        results["wcag_level"] = "AAA"
    elif results["compliance_by_level"]["AA"] >= 85:
        results["wcag_level"] = "AA"
    elif results["compliance_by_level"]["A"] >= 80:
        results["wcag_level"] = "A"
    else:
        results["wcag_level"] = "Fail"
    
    passed_checks = sum(1 for c in checks if c["passed"])
    results["overall_score"] = round((passed_checks / len(checks)) * 100) if checks else 0
    
    for check in checks:
        if not check["passed"]:
            results["issues"].append({
                "criterion": check["criterion"],
                "name": check["name"],
                "principle": check["principle"],
                "level": check.get("level", "A"),
                "severity": check.get("severity", "moderate"),
                "issue": check["message"],
                "impact": check.get("impact", "")
            })
            if check.get("recommendation"):
                results["recommendations"].append({
                    "criterion": check["criterion"],
                    "action": check["recommendation"],
                    "priority": check.get("severity", "moderate")
                })
    
    results["detailed_report"] = _generate_professional_report(results)
    
    return results


def _check_text_alternatives(text, html):
    if not html:
        return {
            "criterion": "1.1.1",
            "name": "Text Alternatives",
            "principle": "perceivable",
            "level": "A",
            "passed": True,
            "message": "No multimedia content to check",
            "impact": "Users with visual impairments can access content",
            "severity": "low"
        }
    
    images = re.findall(r'<img[^>]*>', html, re.IGNORECASE)
    missing_alt = [img for img in images if 'alt=' not in img.lower()]
    
    decorative_keywords = ['decoration', 'spacer', 'divider', 'bullet']
    non_decorative_missing = []
    for img in missing_alt:
        is_decorative = any(kw in img.lower() for kw in decorative_keywords)
        if not is_decorative:
            non_decorative_missing.append(img)
    
    passed = len(non_decorative_missing) == 0
    
    return {
        "criterion": "1.1.1",
        "name": "Text Alternatives",
        "principle": "perceivable",
        "level": "A",
        "passed": passed,
        "details": {
            "total_images": len(images),
            "missing_alt": len(non_decorative_missing)
        },
        "message": "All images have alt text" if passed else f"{len(non_decorative_missing)} images missing alt text",
        "recommendation": None if passed else "Add descriptive alt text to all meaningful images. Use alt='' for decorative images.",
        "impact": "Critical for screen reader users",
        "severity": "critical" if not passed else "low"
    }


def _check_captions_and_transcripts(text, html):
    if not html:
        return {
            "criterion": "1.2.1-1.2.9",
            "name": "Captions & Transcripts",
            "principle": "perceivable",
            "level": "AA",
            "passed": True,
            "message": "No audio/video content detected",
            "impact": "Deaf/hard-of-hearing users can access multimedia",
            "severity": "low"
        }
    
    has_video = bool(re.search(r'<video[^>]*>', html, re.IGNORECASE))
    has_audio = bool(re.search(r'<audio[^>]*>', html, re.IGNORECASE))
    
    has_captions = bool(re.search(r'<track[^>]*kind=["\']captions["\'][^>]*>', html, re.IGNORECASE))
    has_transcript = bool(re.search(r'transcript|caption', html, re.IGNORECASE))
    
    if not (has_video or has_audio):
        passed = True
        message = "No multimedia content to check"
    else:
        passed = has_captions or has_transcript
        message = "Captions/transcripts provided" if passed else "Missing captions or transcripts for multimedia"
    
    return {
        "criterion": "1.2.1-1.2.9",
        "name": "Captions & Transcripts",
        "principle": "perceivable",
        "level": "AA",
        "passed": passed,
        "details": {
            "has_video": has_video,
            "has_audio": has_audio,
            "has_captions": has_captions
        },
        "message": message,
        "recommendation": None if passed else "Provide synchronized captions for videos and transcripts for audio content.",
        "impact": "Critical for deaf/hard-of-hearing users",
        "severity": "critical" if not passed and (has_video or has_audio) else "low"
    }


def _check_adaptable_content(text, html):
    if not html:
        paragraphs = text.split('\n\n')
        paragraphs = [p for p in paragraphs if p.strip()]
        has_structure = len(paragraphs) > 1
        
        return {
            "criterion": "1.3.1-1.3.6",
            "name": "Adaptable Structure",
            "principle": "perceivable",
            "level": "A",
            "passed": has_structure,
            "message": "Content has basic structure" if has_structure else "Content lacks clear structure",
            "recommendation": None if has_structure else "Organize content with clear paragraphs and sections.",
            "impact": "Screen readers can navigate structured content",
            "severity": "moderate"
        }
    
    has_headings = bool(re.search(r'<h[1-6][^>]*>', html, re.IGNORECASE))
    has_lists = bool(re.search(r'<[ou]l[^>]*>', html, re.IGNORECASE))
    has_semantic = bool(re.search(r'<(nav|main|article|section|aside|header|footer)[^>]*>', html, re.IGNORECASE))
    
    headings = re.findall(r'<h([1-6])[^>]*>', html, re.IGNORECASE)
    heading_levels = [int(h) for h in headings]
    
    skipped_levels = False
    if heading_levels:
        for i in range(len(heading_levels) - 1):
            if heading_levels[i+1] > heading_levels[i] + 1:
                skipped_levels = True
                break
    
    passed = has_headings and not skipped_levels
    
    return {
        "criterion": "1.3.1-1.3.6",
        "name": "Adaptable Structure",
        "principle": "perceivable",
        "level": "A",
        "passed": passed,
        "details": {
            "has_headings": has_headings,
            "has_lists": has_lists,
            "has_semantic_html": has_semantic,
            "skipped_heading_levels": skipped_levels
        },
        "message": "Content uses semantic structure" if passed else "Content structure needs improvement",
        "recommendation": None if passed else "Use semantic HTML5 elements and maintain proper heading hierarchy (h1 → h2 → h3).",
        "impact": "Assistive technologies can parse and navigate content",
        "severity": "high" if not passed else "low"
    }


def _check_distinguishable_content(text):
    color_only_phrases = [
        'click the red button', 'green checkmark', 'items in blue',
        'highlighted in yellow', 'shown in gray'
    ]
    
    text_lower = text.lower()
    color_only_references = [phrase for phrase in color_only_phrases if phrase in text_lower]
    
    words = text.split()
    avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
    
    passed = len(color_only_references) == 0 and avg_word_length < 7
    
    return {
        "criterion": "1.4.1-1.4.13",
        "name": "Distinguishable Content",
        "principle": "perceivable",
        "level": "AA",
        "passed": passed,
        "details": {
            "color_only_references": len(color_only_references),
            "avg_word_length": round(avg_word_length, 1)
        },
        "message": "Content is distinguishable without color" if passed else "May rely on color alone for meaning",
        "recommendation": None if passed else "Don't rely solely on color. Use text labels, patterns, or icons alongside color.",
        "impact": "Colorblind users can distinguish important information",
        "severity": "high" if color_only_references else "low"
    }
    

def _check_keyboard_accessible(html):
    if not html:
        return {
            "criterion": "2.1.1-2.1.4",
            "name": "Keyboard Accessibility",
            "principle": "operable",
            "level": "A",
            "passed": True,
            "message": "No interactive elements to check",
            "impact": "Keyboard-only users can navigate and interact",
            "severity": "low"
        }
    
    negative_tabindex = re.findall(r'tabindex=["\'](-\d+)["\']', html, re.IGNORECASE)
    
    onclick_no_keyboard = []
    divs_with_onclick = re.findall(r'<div[^>]*onclick[^>]*>', html, re.IGNORECASE)
    for div in divs_with_onclick:
        if 'onkeypress' not in div.lower() and 'role=' not in div.lower():
            onclick_no_keyboard.append(div)
    
    passed = len(negative_tabindex) == 0 and len(onclick_no_keyboard) == 0
    
    return {
        "criterion": "2.1.1-2.1.4",
        "name": "Keyboard Accessibility",
        "principle": "operable",
        "level": "A",
        "passed": passed,
        "details": {
            "negative_tabindex_count": len(negative_tabindex),
            "non_keyboard_interactive": len(onclick_no_keyboard)
        },
        "message": "All functionality is keyboard accessible" if passed else "Some elements may not be keyboard accessible",
        "recommendation": None if passed else "Ensure all interactive elements can be accessed via keyboard. Add onkeypress handlers or use proper ARIA roles.",
        "impact": "Critical for keyboard-only and motor-impaired users",
        "severity": "critical" if not passed else "low"
    }


def _check_enough_time(text):
    time_limit_keywords = [
        'timeout', 'time limit', 'expires in', 'seconds remaining',
        'session expires', 'will expire', 'auto-logout'
    ]
    
    has_time_limits = any(kw in text.lower() for kw in time_limit_keywords)
    
    has_pause_control = any(kw in text.lower() for kw in ['pause', 'extend', 'adjust time', 'turn off timer'])
    
    passed = not has_time_limits or has_pause_control
    
    return {
        "criterion": "2.2.1-2.2.6",
        "name": "Enough Time",
        "principle": "operable",
        "level": "A",
        "passed": passed,
        "message": "Time limits are adjustable or absent" if passed else "Time limits detected without user control",
        "recommendation": None if passed else "Allow users to turn off, adjust, or extend time limits.",
        "impact": "Users who need more time can complete tasks",
        "severity": "high" if not passed else "low"
    }


def _check_seizures_safety(html):
    if not html:
        return {
            "criterion": "2.3.1-2.3.3",
            "name": "Seizure Safety",
            "principle": "operable",
            "level": "A",
            "passed": True,
            "message": "No animations detected",
            "impact": "Prevents seizures from flashing content",
            "severity": "low"
        }
    
    has_animation = bool(re.search(r'<(blink|marquee)[^>]*>|animation:', html, re.IGNORECASE))
    has_autoplay_video = bool(re.search(r'<video[^>]*autoplay[^>]*>', html, re.IGNORECASE))
    
    has_motion_control = bool(re.search(r'prefers-reduced-motion|pause|stop', html, re.IGNORECASE))
    
    passed = not has_animation or has_motion_control
    
    return {
        "criterion": "2.3.1-2.3.3",
        "name": "Seizure Safety",
        "principle": "operable",
        "level": "A",
        "passed": passed,
        "details": {
            "has_animation": has_animation,
            "has_motion_control": has_motion_control
        },
        "message": "No flashing or safe animations" if passed else "Animations may pose seizure risk",
        "recommendation": None if passed else "Provide pause controls for animations. Respect prefers-reduced-motion. Avoid flashing content > 3 times/second.",
        "impact": "Critical for users with photosensitive epilepsy",
        "severity": "critical" if has_animation and not has_motion_control else "low"
    }


def _check_navigable(html):
    if not html:
        return {
            "criterion": "2.4.1-2.4.13",
            "name": "Navigable",
            "principle": "operable",
            "level": "AA",
            "passed": True,
            "message": "No navigation structure to check",
            "impact": "Users can navigate efficiently",
            "severity": "low"
        }
    
    has_skip_link = bool(re.search(r'skip to (main )?content|skip navigation', html, re.IGNORECASE))
    
    has_title = bool(re.search(r'<title[^>]*>[^<]+</title>', html, re.IGNORECASE))
    
    links = re.findall(r'<a[^>]*>([^<]+)</a>', html, re.IGNORECASE)
    vague_links = ['click here', 'here', 'read more', 'more', 'link']
    has_vague_links = any(link.lower().strip() in vague_links for link in links)
    
    has_focus_styles = bool(re.search(r':focus|outline:', html, re.IGNORECASE))
    
    passed = has_title and not has_vague_links and has_focus_styles
    
    return {
        "criterion": "2.4.1-2.4.13",
        "name": "Navigable",
        "principle": "operable",
        "level": "AA",
        "passed": passed,
        "details": {
            "has_skip_link": has_skip_link,
            "has_title": has_title,
            "has_vague_links": has_vague_links,
            "has_focus_styles": has_focus_styles
        },
        "message": "Content is easily navigable" if passed else "Navigation could be improved",
        "recommendation": None if passed else "Add skip links, descriptive page titles, meaningful link text, and visible focus indicators.",
        "impact": "Keyboard users can navigate efficiently",
        "severity": "high" if not passed else "low"
    }


def _check_input_modalities(html):
    if not html:
        return {
            "criterion": "2.5.1-2.5.8",
            "name": "Input Modalities",
            "principle": "operable",
            "level": "A",
            "passed": True,
            "message": "No input controls to check",
            "impact": "Users can interact using various input methods",
            "severity": "low"
        }
    
    buttons = re.findall(r'<button[^>]*>', html, re.IGNORECASE)
    
    small_clickable = re.findall(r'<(span|i|small)[^>]*onclick[^>]*>', html, re.IGNORECASE)
    
    passed = len(small_clickable) == 0
    
    return {
        "criterion": "2.5.1-2.5.8",
        "name": "Input Modalities",
        "principle": "operable",
        "level": "A",
        "passed": passed,
        "details": {
            "small_clickable_elements": len(small_clickable)
        },
        "message": "Touch targets are adequately sized" if passed else "Some touch targets may be too small",
        "recommendation": None if passed else "Ensure touch targets are at least 44x44 CSS pixels for motor-impaired users.",
        "impact": "Users with motor impairments can click/tap accurately",
        "severity": "moderate" if not passed else "low"
    }


def _check_readable(text):
    try:
        import textstat
        
        fk_grade = textstat.flesch_kincaid_grade(text)
        fk_ease = textstat.flesch_reading_ease(text)
        gunning_fog = textstat.gunning_fog(text)
        
        passed_aaa = fk_grade <= 9
        
        passed_aa = fk_grade <= 12
        
        level = "AAA" if passed_aaa else ("AA" if passed_aa else "A")
        passed = passed_aa
        
        return {
            "criterion": "3.1.1-3.1.6",
            "name": "Readable",
            "principle": "understandable",
            "level": level,
            "passed": passed,
            "details": {
                "flesch_kincaid_grade": round(fk_grade, 1),
                "flesch_reading_ease": round(fk_ease, 1),
                "gunning_fog": round(gunning_fog, 1),
                "target_grade": "≤ 9 for AAA, ≤ 12 for AA"
            },
            "message": f"Reading level: Grade {round(fk_grade, 1)} ({level} compliant)" if passed else f"Reading level too high: Grade {round(fk_grade, 1)}",
            "recommendation": None if passed else "Simplify text using shorter sentences and common words. Target 8th-9th grade reading level.",
            "impact": "People with cognitive disabilities can understand content",
            "severity": "high" if not passed else "low"
        }
    except ImportError:
        return _fallback_readable(text)


def _fallback_readable(text):
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s for s in sentences if s.strip()]
    
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    avg_word_length = sum(len(w) for w in words) / len(words) if words else 0
    
    passed = avg_sentence_length < 20 and avg_word_length < 6
    
    return {
        "criterion": "3.1.5",
        "name": "Readable",
        "principle": "understandable",
        "level": "AAA",
        "passed": passed,
        "details": {
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_word_length": round(avg_word_length, 1)
        },
        "message": "Text appears readable" if passed else "Text may be too complex",
        "recommendation": None if passed else "Use shorter sentences (< 20 words) and simpler words (< 6 characters average).",
        "impact": "Improves comprehension for all users",
        "severity": "moderate"
    }


def _check_language_clarity(text):
    #Check for jargon and complex terms
    complex_jargon = [
        'utilize', 'leverage', 'synergy', 'paradigm', 'facilitate',
        'implement', 'methodology', 'aforementioned', 'heretofore',
        'notwithstanding', 'whereby', 'wherein', 'thereof'
    ]
    
    text_lower = text.lower()
    found_jargon = [term for term in complex_jargon if term in text_lower]
    
    abbreviations = set(re.findall(r'\b[A-Z]{2,5}\b', text))
    common_abbr = {'USA', 'UK', 'CEO', 'PDF', 'HTML', 'URL', 'FAQ', 'AM', 'PM', 'US', 'IT', 'AI', 'API'}
    unexplained = [abbr for abbr in abbreviations if abbr not in common_abbr]
    
    passed = len(found_jargon) <= 2 and len(unexplained) <= 1
    
    return {
        "criterion": "3.1.2-3.1.5",
        "name": "Language Clarity",
        "principle": "understandable",
        "level": "AAA",
        "passed": passed,
        "details": {
            "jargon_found": found_jargon[:5],
            "unexplained_abbreviations": unexplained[:5]
        },
        "message": "Language is clear and simple" if passed else f"Contains jargon or unexplained abbreviations",
        "recommendation": None if passed else "Replace jargon with plain language. Define abbreviations on first use.",
        "impact": "Non-native speakers and those with cognitive disabilities can understand",
        "severity": "moderate" if not passed else "low"
    }


def _check_predictable(html):
    if not html:
        return {
            "criterion": "3.2.1-3.2.6",
            "name": "Predictable",
            "principle": "understandable",
            "level": "AA",
            "passed": True,
            "message": "No interactive elements to check",
            "impact": "Interface behaves consistently",
            "severity": "low"
        }
    
    has_autofocus = bool(re.search(r'autofocus', html, re.IGNORECASE))
    
    auto_submit_onchange = bool(re.search(r'onchange=["\'][^"\']*submit', html, re.IGNORECASE))
    
    has_nav = bool(re.search(r'<nav[^>]*>', html, re.IGNORECASE))
    
    passed = not has_autofocus and not auto_submit_onchange
    
    return {
        "criterion": "3.2.1-3.2.6",
        "name": "Predictable",
        "principle": "understandable",
        "level": "AA",
        "passed": passed,
        "details": {
            "has_autofocus": has_autofocus,
            "auto_submit_on_change": auto_submit_onchange
        },
        "message": "Interface is predictable" if passed else "Interface may surprise users",
        "recommendation": None if passed else "Avoid automatic focus changes and form auto-submission. Users should control when actions occur.",
        "impact": "Users with cognitive disabilities aren't confused by unexpected changes",
        "severity": "moderate" if not passed else "low"
    }


def _check_input_assistance(html):
    if not html:
        return {
            "criterion": "3.3.1-3.3.8",
            "name": "Input Assistance",
            "principle": "understandable",
            "level": "AA",
            "passed": True,
            "message": "No forms to check",
            "impact": "Users can complete forms without errors",
            "severity": "low"
        }
    
    inputs = re.findall(r'<input[^>]*>', html, re.IGNORECASE)
    labels = re.findall(r'<label[^>]*>', html, re.IGNORECASE)
    
    has_error_handling = bool(re.search(r'error|invalid|required', html, re.IGNORECASE))
    
    has_aria_labels = bool(re.search(r'aria-label|aria-labelledby', html, re.IGNORECASE))
    
    if not inputs:
        passed = True
        message = "No form inputs to check"
    else:
        has_labels = len(labels) >= len(inputs) * 0.8 or has_aria_labels
        passed = has_labels
        message = "Form inputs have labels" if passed else "Some inputs missing labels"
    
    return {
        "criterion": "3.3.1-3.3.8",
        "name": "Input Assistance",
        "principle": "understandable",
        "level": "AA",
        "passed": passed,
        "details": {
            "input_count": len(inputs),
            "label_count": len(labels),
            "has_error_handling": has_error_handling
        },
        "message": message,
        "recommendation": None if passed else "Provide visible labels for all form inputs. Include clear error messages and suggestions.",
        "impact": "Users can understand and correct form errors",
        "severity": "high" if not passed and inputs else "low"
    }


def _check_compatible(html):
    if not html:
        return {
            "criterion": "4.1.1-4.1.3",
            "name": "Compatible",
            "principle": "robust",
            "level": "A",
            "passed": True,
            "message": "No HTML to validate",
            "impact": "Content works with assistive technologies",
            "severity": "low"
        }
    
    unclosed_tags = []
    opening_tags = re.findall(r'<(\w+)[^/>]*(?<!/)>', html)
    closing_tags = re.findall(r'</(\w+)>', html)
    
    for tag in set(opening_tags):
        if tag.lower() not in ['img', 'br', 'hr', 'input', 'meta', 'link']:  # Self-closing tags
            open_count = opening_tags.count(tag)
            close_count = closing_tags.count(tag)
            if open_count != close_count:
                unclosed_tags.append(tag)
    
    has_aria = bool(re.search(r'role=|aria-', html, re.IGNORECASE))
    
    ids = re.findall(r'id=["\']([^"\']+)["\']', html, re.IGNORECASE)
    duplicate_ids = len(ids) != len(set(ids))
    
    passed = len(unclosed_tags) == 0 and not duplicate_ids
    
    return {
        "criterion": "4.1.1-4.1.3",
        "name": "Compatible",
        "principle": "robust",
        "level": "A",
        "passed": passed,
        "details": {
            "unclosed_tags": unclosed_tags[:5],
            "has_aria": has_aria,
            "has_duplicate_ids": duplicate_ids
        },
        "message": "HTML is well-formed" if passed else "HTML has structural issues",
        "recommendation": None if passed else "Fix unclosed tags and duplicate IDs. Validate HTML markup.",
        "impact": "Assistive technologies can parse content correctly",
        "severity": "high" if not passed else "low"
    }

# report generation

def _generate_professional_report(results):
    
    lines = []
    
    lines.append("╔══════════════════════════════════════════════════════════════════════╗")
    lines.append("║       PROFESSIONAL WCAG 2.2 ACCESSIBILITY COMPLIANCE REPORT          ║")
    lines.append("╚══════════════════════════════════════════════════════════════════════╝")
    lines.append("")
    
    lines.append("═══════════════════════════════════════════════════════════════════════")
    lines.append("COMPLIANCE SUMMARY")
    lines.append("═══════════════════════════════════════════════════════════════════════")
    lines.append(f"Overall Score:       {results['overall_score']}%")
    lines.append(f"WCAG Compliance:     Level {results['wcag_level']}")
    lines.append(f"Total Checks:        {len(results['checks'])}")
    lines.append(f"Issues Found:        {len(results['issues'])}")
    lines.append("")
    
    lines.append("Compliance by WCAG Level:")
    lines.append(f"  • Level A:         {results['compliance_by_level']['A']}%")
    lines.append(f"  • Level AA:        {results['compliance_by_level']['AA']}%")
    lines.append(f"  • Level AAA:       {results['compliance_by_level']['AAA']}%")
    lines.append("")
    
    lines.append("═══════════════════════════════════════════════════════════════════════")
    lines.append("POUR PRINCIPLES COMPLIANCE")
    lines.append("═══════════════════════════════════════════════════════════════════════")
    for principle, score in results['principle_scores'].items():
        status = "✓" if score >= 80 else "✗"
        lines.append(f"{status} {principle.upper():20} {score}%")
    lines.append("")
    
    if results['issues']:
        lines.append("═══════════════════════════════════════════════════════════════════════")
        lines.append("ACCESSIBILITY ISSUES")
        lines.append("═══════════════════════════════════════════════════════════════════════")
        
        by_severity = defaultdict(list)
        for issue in results['issues']:
            by_severity[issue['severity']].append(issue)
        
        severity_order = ['critical', 'high', 'moderate', 'low']
        issue_num = 1
        
        for severity in severity_order:
            if severity in by_severity:
                icon = "🔴" if severity == "critical" else "🟠" if severity == "high" else "🟡" if severity == "moderate" else "🟢"
                lines.append(f"\n{icon} {severity.upper()} SEVERITY:")
                lines.append("─" * 70)
                
                for issue in by_severity[severity]:
                    lines.append(f"{issue_num}. [{issue['criterion']}] {issue['name']}")
                    lines.append(f"   Issue: {issue['issue']}")
                    lines.append(f"   Impact: {issue['impact']}")
                    lines.append(f"   Principle: {issue['principle'].upper()} | Level: {issue['level']}")
                    lines.append("")
                    issue_num += 1
    else:
        lines.append("═══════════════════════════════════════════════════════════════════════")
        lines.append("✓ NO ACCESSIBILITY ISSUES DETECTED")
        lines.append("═══════════════════════════════════════════════════════════════════════")
        lines.append("")
    
    if results['recommendations']:
        lines.append("═══════════════════════════════════════════════════════════════════════")
        lines.append("REMEDIATION RECOMMENDATIONS")
        lines.append("═══════════════════════════════════════════════════════════════════════")
        
        by_priority = defaultdict(list)
        for rec in results['recommendations']:
            by_priority[rec['priority']].append(rec)
        
        rec_num = 1
        for priority in ['critical', 'high', 'moderate', 'low']:
            if priority in by_priority:
                icon = "❗" if priority == "critical" else "⚠️" if priority == "high" else "ℹ️"
                lines.append(f"\n{icon} {priority.upper()} PRIORITY:")
                for rec in by_priority[priority]:
                    lines.append(f"{rec_num}. [{rec['criterion']}] {rec['action']}")
                    rec_num += 1
        lines.append("")
    
    lines.append("═══════════════════════════════════════════════════════════════════════")
    lines.append("ACCESSIBILITY BEST PRACTICES")
    lines.append("═══════════════════════════════════════════════════════════════════════")
    lines.append("✓ Test with screen readers (NVDA, JAWS, VoiceOver)")
    lines.append("✓ Verify keyboard-only navigation")
    lines.append("✓ Check color contrast ratios (4.5:1 for text, 3:1 for UI)")
    lines.append("✓ Validate HTML and ARIA markup")
    lines.append("✓ Test with users who have disabilities")
    lines.append("✓ Maintain accessibility throughout content updates")
    lines.append("")
    lines.append("═══════════════════════════════════════════════════════════════════════")
    
    return "\n".join(lines)
