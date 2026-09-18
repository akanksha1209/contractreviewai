"""
Contract analysis.

Pipeline:
    1. Split the contract text into paragraph-sized chunks.
    2. For each chunk, run the ML clause classifier (TF-IDF + LinearSVC).
    3. If the model's confidence exceeds a threshold, use its prediction.
    4. Fall back to keyword matching when:
       - the model is unavailable, or
       - the model's confidence is too low, or
       - the model says "Other".
    5. Compute a rule-based risk score from the detected clauses.
    6. Ask Gemini for a plain-English advisory (falls back locally on failure).
"""

import os
import re
import joblib
from typing import Dict, List, Optional, Tuple

from services.nlp import extract_entities, build_summary
from services.advisory import generate_advisory

MODEL_PATH = os.path.join("ml_models", "clause_clf.joblib")

_model_bundle = None
_model_loaded = False


def _load_model():
    global _model_bundle, _model_loaded
    if _model_loaded:
        return _model_bundle

    _model_loaded = True
    if not os.path.exists(MODEL_PATH):
        print(f"[analyze] ML model not found at {MODEL_PATH}; using keyword-only mode.")
        return None

    try:
        _model_bundle = joblib.load(MODEL_PATH)
        print(f"[analyze] Loaded ML model from {MODEL_PATH}")
    except Exception as exc:
        print(f"[analyze] Failed to load model: {exc}")
        _model_bundle = None

    return _model_bundle


CATEGORIES: Dict[str, Dict] = {
    "Termination": {"keywords": ["termination", "terminate", "termination notice"], "risk": 20},
    "Payment": {"keywords": ["payment", "late payment", "invoice", "fee", "penalty"], "risk": 10},
    "Liability": {"keywords": ["liability", "liable", "indemnity", "indemnification", "damages"], "risk": 20},
    "Confidentiality": {"keywords": ["confidentiality", "confidential information", "non-disclosure", "nda"], "risk": 10},
    "Intellectual Property": {"keywords": ["intellectual property", "copyright", "ownership", "proprietary rights"], "risk": 15},
    "Dispute Resolution": {"keywords": ["dispute", "arbitration", "jurisdiction", "governing law", "court"], "risk": 10},
}

ML_MARGIN_THRESHOLD = 0.15
MAX_PARAGRAPH_CHARS = 1200
MIN_PARAGRAPH_CHARS = 40


def _find_clause_by_keywords(text: str, keywords: List[str]) -> str:
    text_lower = text.lower()
    for keyword in keywords:
        pos = text_lower.find(keyword.lower())
        if pos != -1:
            start = max(0, pos - 150)
            end = min(len(text), pos + 500)
            return text[start:end].replace("\n", " ").strip()
    return ""


def _keyword_detect(text: str) -> Dict[str, Optional[str]]:
    text_lower = text.lower()
    detected: Dict[str, Optional[str]] = {}
    for category, data in CATEGORIES.items():
        found = next((k for k in data["keywords"] if k.lower() in text_lower), None)
        detected[category] = _find_clause_by_keywords(text, data["keywords"]) if found else None
    return detected


def _split_paragraphs(text: str) -> List[str]:
    chunks = [c.strip() for c in re.split(r"\n\s*\n", text) if c.strip()]
    if len(chunks) < 5:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        buf = []
        for s in sentences:
            buf.append(s.strip())
            if len(" ".join(buf)) > 400:
                chunks.append(" ".join(buf))
                buf = []
        if buf:
            chunks.append(" ".join(buf))
    chunks = [c[:MAX_PARAGRAPH_CHARS] for c in chunks]
    return [c for c in chunks if len(c) >= MIN_PARAGRAPH_CHARS]


def _ml_detect(text: str) -> Dict[str, Tuple[str, float]]:
    bundle = _load_model()
    if bundle is None:
        return {}

    vectorizer = bundle["vectorizer"]
    clf = bundle["clf"]

    paragraphs = _split_paragraphs(text)
    if not paragraphs:
        return {}

    vectors = vectorizer.transform(paragraphs)
    predictions = clf.predict(vectors)
    scores = clf.decision_function(vectors)
    classes = list(clf.classes_)

    best: Dict[str, Tuple[str, float]] = {}
    for i, (para, pred) in enumerate(zip(paragraphs, predictions)):
        if pred == "Other" or pred not in CATEGORIES or pred not in classes:
            continue
        margin = float(scores[i][classes.index(pred)])
        if margin < ML_MARGIN_THRESHOLD:
            continue
        prev = best.get(pred)
        if prev is None or margin > prev[1]:
            best[pred] = (para, margin)
    return best


def analyze_contract(text: str) -> dict:
    text_lower = text.lower()
    clauses: List[Dict] = []
    total_risk = 0

    ml_hits = _ml_detect(text)
    keyword_hits = _keyword_detect(text)

    for category, data in CATEGORIES.items():
        ml = ml_hits.get(category)
        kw_para = keyword_hits.get(category)

        if ml:
            paragraph, margin = ml
            source = "ml"
            confidence_value = round(margin, 3)
        elif kw_para:
            paragraph = kw_para
            source = "keyword"
            confidence_value = None
        else:
            clauses.append({
                "category": category,
                "risk": "Not Found",
                "keyword": None,
                "description": f"No clear {category.lower()} clause was detected.",
                "source": "none",
                "confidence": None,
            })
            continue

        total_risk += data["risk"]
        risk = "High" if data["risk"] >= 20 else "Medium" if data["risk"] >= 15 else "Low"

        clauses.append({
            "category": category,
            "risk": risk,
            "keyword": next((k for k in data["keywords"] if k.lower() in (paragraph or "").lower()), None),
            "description": paragraph or "",
            "source": source,
            "confidence": confidence_value,
        })

    risk_score = min(total_risk, 100)
    risk_level = "HIGH RISK" if risk_score >= 70 else "MEDIUM RISK" if risk_score >= 40 else "LOW RISK"

    warnings = []
    checks = {
        "automatic renewal": "Automatic renewal clause detected.",
        "unlimited liability": "Unlimited liability clause detected.",
        "penalty": "Penalty provision detected.",
        "non-compete": "Non-compete restriction detected.",
        "personal data": "Personal data provisions detected.",
    }
    for needle, message in checks.items():
        if needle in text_lower:
            warnings.append(message)

    entities = extract_entities(text)
    summary = build_summary(text)
    if not summary:
        summary = (
            f"The contract was reviewed across {len(CATEGORIES)} categories. "
            f"Risk score: {risk_score}/100 ({risk_level})."
        )

    # Build partial result, then ask Gemini for the advisory.
    result = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "summary": summary,
        "warnings": warnings,
        "clauses": clauses,
        "entities": entities,
        "text_length": len(text),
        "word_count": len(text.split()),
    }

    result["advisory"] = generate_advisory(result)
    return result
