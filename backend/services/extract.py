import os
import fitz
from docx import Document


def extract_pdf_text(file_path: str) -> str:
    text = []
    pdf = fitz.open(file_path)
    for page in pdf:
        text.append(page.get_text())
    pdf.close()
    return "\n".join(text)


def extract_docx_text(file_path: str) -> str:
    document = Document(file_path)
    return "\n".join(p.text for p in document.paragraphs)


def extract_text(file_path: str, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return extract_pdf_text(file_path)
    if ext == ".docx":
        return extract_docx_text(file_path)
    raise ValueError("Only PDF and DOCX files are supported.")
