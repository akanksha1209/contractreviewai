from functools import lru_cache
import spacy


@lru_cache(maxsize=1)
def _load_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        return None


KEEP_LABELS = {"PERSON", "ORG", "DATE", "MONEY", "GPE", "LAW", "PERCENT", "TIME"}


def extract_entities(text: str):
    nlp = _load_nlp()
    if nlp is None or not text:
        return []

    step = 100_000
    chunks = [text[i:i + step] for i in range(0, len(text), step)]

    seen = set()
    results = []
    for chunk in chunks:
        doc = nlp(chunk)
        for ent in doc.ents:
            if ent.label_ not in KEEP_LABELS:
                continue
            key = (ent.label_, ent.text.strip().lower())
            if key in seen:
                continue
            seen.add(key)
            results.append({
                "label": ent.label_,
                "text": ent.text.strip(),
                "start_char": ent.start_char,
                "end_char": ent.end_char,
            })
    return results


def build_summary(text: str, max_sentences: int = 5) -> str:
    if not text:
        return ""

    import re
    from collections import Counter

    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    if len(sentences) <= max_sentences:
        return text.strip()

    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    freq = Counter(words)

    def score(sentence: str) -> float:
        tokens = re.findall(r"[a-zA-Z]{4,}", sentence.lower())
        if not tokens:
            return 0.0
        return sum(freq[w] for w in tokens) / len(tokens)

    ranked = sorted(sentences, key=score, reverse=True)[:max_sentences]
    ordered = [s for s in sentences if s in ranked]
    return " ".join(ordered)
