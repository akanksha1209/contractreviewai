import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas import AnalysisOut
from services.extract import extract_text
from services.analyze import analyze_contract

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=AnalysisOut)
async def analyze_anonymous(file: UploadFile = File(...)):
    """
    Analyze a contract without saving anything.
    No authentication required. File is processed in-memory/temp and discarded.
    """
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    contents = await file.read()

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path, filename)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in the document.")

    return analyze_contract(text)
