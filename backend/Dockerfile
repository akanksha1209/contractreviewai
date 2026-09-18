# ---------- Python 3.12 slim base ----------
FROM python:3.12-slim

# ---------- System deps ----------
# PyMuPDF and spaCy need a few build libs. tesseract not required (no OCR).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ---------- Working dir ----------
WORKDIR /app

# ---------- Python deps ----------
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt \
 && python -m spacy download en_core_web_sm

# ---------- App code ----------
COPY . .

# ---------- Make sure runtime dirs exist ----------
RUN mkdir -p /app/uploads /app/ml_models /app/data

# ---------- Expose port (Render expects the app to bind to $PORT) ----------
EXPOSE 8000

# ---------- Startup ----------
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
