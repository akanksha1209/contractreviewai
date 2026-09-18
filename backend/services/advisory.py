"""
Advisory generator.

Sends the analysis findings (not the full contract) to Gemini and asks for
a short, plain-English advisory. Falls back to a local rule-based generator
if the API call fails for any reason.
"""

import os
from typing import Dict, List

try:
    from google import genai
    _GENAI_AVAILABLE = True
except ImportError:
    _GENAI_AVAILABLE = False

MODEL_NAME = "gemini-3.6-flash"

_client = None
_client_loaded = False


def _get_client():
    global _client, _client_loaded
    if _client_loaded:
        return _client
    _client_loaded = True

    if not _GENAI_AVAILABLE:
        print("[advisory] google-genai not installed; using fallback.")
        return None

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[advisory] GEMINI_API_KEY not set; using fallback.")
        return None

    try:
        _client = genai.Client(api_key=api_key)
        print(f"[advisory] Gemini client ready (model={MODEL_NAME}).")
    except Exception as exc:
        print(f"[advisory] Failed to create Gemini client: {exc}")
        _client = None

    return _client


# ------------------------------------------------------------------
# Prompt
# ------------------------------------------------------------------

def _build_prompt(analysis: Dict) -> str:
    """
    Build a short prompt from the analysis findings. We deliberately
    send only the summary data — not the full contract text — to keep
    the request fast and minimise privacy concerns.
    """
    risk_score = analysis.get("risk_score", 0)
    risk_level = analysis.get("risk_level", "UNKNOWN")
    warnings = analysis.get("warnings", [])
    clauses = analysis.get("clauses", [])
    entities = analysis.get("entities", [])

    detected = [c for c in clauses if c.get("risk") not in ("Not Found", None)]
    high_risk = [c for c in detected if c.get("risk") == "High"]

    lines = [
        "You are a contract review assistant. Given these automated findings "
        "from a contract analysis, write a short advisory for the person about "
        "to sign it.",
        "",
        f"Risk score: {risk_score}/100 ({risk_level})",
        f"Words: {analysis.get('word_count', 0)}",
        "",
        "Detected clause categories:",
    ]
    for c in detected:
        line = f"- {c['category']} ({c.get('risk', 'unknown')} risk"
        if c.get("source") == "ml":
            line += ", detected by ML model"
        elif c.get("source") == "keyword":
            line += ", matched by keyword rules"
        line += ")"
        lines.append(line)

    if high_risk:
        lines.append("")
        lines.append("High-risk clauses (quote from the contract where helpful):")
        for c in high_risk:
            snippet = (c.get("description") or "").strip()[:250]
            if snippet:
                lines.append(f"- {c['category']}: \"{snippet}\"")

    if warnings:
        lines.append("")
        lines.append("Automated warnings:")
        for w in warnings:
            lines.append(f"- {w}")

    if entities:
        top = [e for e in entities if e.get("label") in ("ORG", "PERSON", "GPE", "DATE")][:6]
        if top:
            lines.append("")
            lines.append("Key entities mentioned:")
            for e in top:
                lines.append(f"- {e['label']}: {e['text']}")

    lines.extend([
        "",
        "Now write the advisory. Format:",
        "1. A 3–4 sentence paragraph explaining what is wrong or risky about "
        "this specific contract. Reference actual clause names and quotes "
        "where useful. Do not use generic filler.",
        "2. Then 3–5 bullet points (each starting with '- ') stating the specific "
        "issues the reader should be careful about before accepting.",
        "3. End with a one-line recommended action.",
        "",
        "Tone: factual, direct, professional. No flattery. No mention of "
        "AI or automation. Do not invent clauses that are not listed above.",
    ])

    return "\n".join(lines)


# ------------------------------------------------------------------
# Fallback generator (rule-based, used if Gemini fails)
# ------------------------------------------------------------------

def _fallback_advisory(analysis: Dict) -> Dict:
    risk_score = analysis.get("risk_score", 0)
    risk_level = analysis.get("risk_level", "UNKNOWN")
    warnings = analysis.get("warnings", [])
    clauses = analysis.get("clauses", [])

    detected = [c for c in clauses if c.get("risk") not in ("Not Found", None)]
    high_risk = [c for c in detected if c.get("risk") == "High"]

    lines = []
    lines.append(
        f"This contract scores {risk_score}/100 ({risk_level}) based on the "
        f"analysis of {len(detected)} clause categories."
    )
    if high_risk:
        cats = ", ".join(c["category"] for c in high_risk)
        lines.append(f"High-risk clauses were detected in: {cats}.")
    if warnings:
        lines.append(f"{len(warnings)} automated warnings were flagged.")
    paragraph = " ".join(lines)

    bullets = []
    for w in warnings:
        bullets.append(w.rstrip("."))
    for c in high_risk:
        snippet = (c.get("description") or "").strip().replace("\n", " ")[:160]
        if snippet:
            bullets.append(f"{c['category']} clause: {snippet}...")
        else:
            bullets.append(f"{c['category']} clause rated high risk.")

    if not bullets:
        bullets.append("No major issues were flagged by the automated analysis.")

    if risk_score >= 70:
        advice = "We recommend negotiating the flagged clauses before signing."
    elif risk_score >= 40:
        advice = "Review the flagged clauses carefully before signing."
    else:
        advice = "No significant concerns were detected."

    return {
        "paragraph": paragraph,
        "bullets": bullets[:5],
        "advice": advice,
        "source": "fallback",
    }


# ------------------------------------------------------------------
# Public entry point
# ------------------------------------------------------------------

def generate_advisory(analysis: Dict) -> Dict:
    """
    Returns:
        {
          "paragraph": str,
          "bullets": [str, ...],
          "advice": str,
          "source": "gemini" | "fallback"
        }
    """
    client = _get_client()
    if client is None:
        return _fallback_advisory(analysis)

    try:
        prompt = _build_prompt(analysis)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )
        text = (response.text or "").strip()
        if not text:
            raise ValueError("Empty response from Gemini")

        paragraph, bullets, advice = _parse_response(text)
        if not paragraph:
            raise ValueError("Could not parse Gemini response")

        return {
            "paragraph": paragraph,
            "bullets": bullets,
            "advice": advice,
            "source": "gemini",
        }

    except Exception as exc:
        print(f"[advisory] Gemini call failed ({type(exc).__name__}: {exc}); using fallback.")
        return _fallback_advisory(analysis)


def _parse_response(text: str):
    """
    Split Gemini output into paragraph, bullet list, and closing advice.
    Handles a few common formats robustly.
    """
    lines = [l.rstrip() for l in text.splitlines() if l.strip()]

    paragraph_parts: List[str] = []
    bullets: List[str] = []
    advice_parts: List[str] = []

    mode = "para"
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(("- ", "* ", "• ")):
            mode = "bullets"
            bullets.append(stripped[2:].strip())
        elif mode == "bullets" and (
            stripped.lower().startswith(("recommended", "recommendation", "advice", "action"))
        ):
            mode = "advice"
            advice_parts.append(stripped)
        elif mode == "para":
            paragraph_parts.append(stripped)
        elif mode == "bullets":
            # continuation of a bullet or start of closing
            if len(stripped) < 60 and bullets:
                bullets[-1] += " " + stripped
            else:
                advice_parts.append(stripped)
        else:
            advice_parts.append(stripped)

    paragraph = " ".join(paragraph_parts).strip()
    advice = " ".join(advice_parts).strip()

    return paragraph, bullets[:6], advice
