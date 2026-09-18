from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    stored_path = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    summary = Column(Text, default="")
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW RISK")
    word_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # ---- Decision ----
    decision = Column(String, nullable=True)     # "accept" | "reject" | "pending"
    decided_at = Column(DateTime, nullable=True)

    owner = relationship("User", back_populates="documents")
    clauses = relationship("Clause", back_populates="document", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="document", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    category = Column(String, nullable=False)
    risk = Column(String, nullable=False)
    keyword = Column(String, nullable=True)
    description = Column(Text, default="")

    document = relationship("Document", back_populates="clauses")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    label = Column(String, nullable=False)
    text = Column(String, nullable=False)
    start_char = Column(Integer, default=0)
    end_char = Column(Integer, default=0)

    document = relationship("Document", back_populates="entities")
