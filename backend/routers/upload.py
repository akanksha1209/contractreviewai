import os
import uuid
import tempfile

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import User, Document, Clause, Entity
from schemas import UploadResponse
from auth import get_current_user
from services.extract import extract_text
from services.analyze import analyze_contract

router = APIRouter(tags=["upload"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pdf", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    contents = await file.read()

    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(contents)

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            text = extract_text(tmp_path, filename)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        if not text.strip():
            raise ValueError("No readable text found in the document.")

        analysis = analyze_contract(text)

        doc = Document(
            owner_id=current_user.id,
            filename=filename,
            stored_path=stored_path,
            text=text,
            summary=analysis["summary"],
            risk_score=analysis["risk_score"],
            risk_level=analysis["risk_level"],
            word_count=analysis["word_count"],
        )
        db.add(doc)
        db.flush()

        for c in analysis["clauses"]:
            db.add(Clause(
                document_id=doc.id,
                category=c["category"],
                risk=c["risk"],
                keyword=c.get("keyword"),
                description=c.get("description", ""),
            ))

        for e in analysis["entities"]:
            db.add(Entity(
                document_id=doc.id,
                label=e["label"],
                text=e["text"],
                start_char=e["start_char"],
                end_char=e["end_char"],
            ))

        db.commit()
        db.refresh(doc)

        return {
            "success": True,
            "document_id": doc.id,
            "filename": filename,
            "message": "Contract analyzed and saved successfully.",
            "analysis": analysis,
        }

    except Exception as exc:
        db.rollback()
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise HTTPException(status_code=400, detail=str(exc))
