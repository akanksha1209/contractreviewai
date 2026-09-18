from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ClauseOut(BaseModel):
    category: str
    risk: str
    keyword: Optional[str] = None
    description: str = ""
    source: Optional[str] = None
    confidence: Optional[float] = None

    class Config:
        from_attributes = True


class EntityOut(BaseModel):
    label: str
    text: str
    start_char: int
    end_char: int

    class Config:
        from_attributes = True


class AdvisoryOut(BaseModel):
    paragraph: str = ""
    bullets: List[str] = []
    advice: str = ""
    source: str = "fallback"


class AnalysisOut(BaseModel):
    risk_score: int
    risk_level: str
    summary: str
    warnings: List[str]
    clauses: List[ClauseOut]
    entities: List[EntityOut]
    text_length: int
    word_count: int
    advisory: Optional[AdvisoryOut] = None


class UploadResponse(BaseModel):
    success: bool
    document_id: int
    filename: str
    message: str
    analysis: AnalysisOut


class DocumentListItem(BaseModel):
    id: int
    filename: str
    risk_score: int
    risk_level: str
    word_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentDetail(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    analysis: AnalysisOut
