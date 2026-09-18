import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, Document
from schemas import DocumentListItem, DocumentDetail, AnalysisOut
from auth import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])


def _to_analysis(doc: Document) -> AnalysisOut:
    return AnalysisOut(
        risk_score=doc.risk_score,
        risk_level=doc.risk_level,
        summary=doc.summary,
        warnings=[],
        clauses=[{
            "category": c.category,
            "risk": c.risk,
            "keyword": c.keyword,
            "description": c.description,
        } for c in doc.clauses],
        entities=[{
            "label": e.label,
            "text": e.text,
            "start_char": e.start_char,
            "end_char": e.end_char,
        } for e in doc.entities],
        text_length=len(doc.text or ""),
        word_count=doc.word_count,
        advisory=None,
    )


@router.get("", response_model=List[DocumentListItem])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Document)
        .filter(Document.owner_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )


@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentDetail(
        id=doc.id,
        filename=doc.filename,
        uploaded_at=doc.uploaded_at,
        analysis=_to_analysis(doc),
    )


@router.get("/{document_id}/entities")
def get_entities(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return [
        {"label": e.label, "text": e.text,
         "start_char": e.start_char, "end_char": e.end_char}
        for e in doc.entities
    ]


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.owner_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.stored_path and os.path.exists(doc.stored_path):
        try:
            os.remove(doc.stored_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
    return {"success": True, "deleted_id": document_id}
