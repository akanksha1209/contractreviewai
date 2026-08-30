from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import fitz
from docx import Document
import os
import tempfile

app = FastAPI(
    title="AI Contract Review System",
    description="Backend API for AI-powered contract analysis",
    version="1.0.0"
)

# ==============================
# CORS
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# HOME
# ==============================

@app.get("/")
def home():
    return {
        "message": "AI Contract Review API is running",
        "status": "success"
    }


# ==============================
# PDF TEXT EXTRACTION
# ==============================

def extract_pdf_text(file_path):

    text = ""

    pdf = fitz.open(file_path)

    for page in pdf:
        text += page.get_text()

    pdf.close()

    return text


# ==============================
# DOCX TEXT EXTRACTION
# ==============================

def extract_docx_text(file_path):

    document = Document(file_path)

    text = []

    for paragraph in document.paragraphs:
        text.append(paragraph.text)

    return "\n".join(text)


# ==============================
# EXTRACT CONTRACT TEXT
# ==============================

def extract_text(file_path, filename):

    extension = os.path.splitext(filename)[1].lower()

    if extension == ".pdf":
        return extract_pdf_text(file_path)

    if extension == ".docx":
        return extract_docx_text(file_path)

    raise ValueError(
        "Only PDF and DOCX files are supported."
    )


# ==============================
# FIND CLAUSE TEXT
# ==============================

def find_clause(text, keywords):

    text_lower = text.lower()

    for keyword in keywords:

        position = text_lower.find(
            keyword.lower()
        )

        if position != -1:

            start = max(
                0,
                position - 150
            )

            end = min(
                len(text),
                position + 500
            )

            return text[start:end].replace(
                "\n",
                " "
            )

    return ""


# ==============================
# CONTRACT ANALYSIS
# ==============================

def analyze_contract(text):

    text_lower = text.lower()

    categories = {

        "Termination": {
            "keywords": [
                "termination",
                "terminate",
                "termination notice"
            ],
            "risk": 20
        },

        "Payment": {
            "keywords": [
                "payment",
                "late payment",
                "invoice",
                "fee",
                "penalty"
            ],
            "risk": 10
        },

        "Liability": {
            "keywords": [
                "liability",
                "liable",
                "indemnity",
                "indemnification",
                "damages"
            ],
            "risk": 20
        },

        "Confidentiality": {
            "keywords": [
                "confidentiality",
                "confidential information",
                "non-disclosure",
                "nda"
            ],
            "risk": 10
        },

        "Intellectual Property": {
            "keywords": [
                "intellectual property",
                "copyright",
                "ownership",
                "proprietary rights"
            ],
            "risk": 15
        },

        "Dispute Resolution": {
            "keywords": [
                "dispute",
                "arbitration",
                "jurisdiction",
                "governing law",
                "court"
            ],
            "risk": 10
        }
    }

    clauses = []

    total_risk = 0

    # ==============================
    # CHECK EACH CLAUSE
    # ==============================

    for category, data in categories.items():

        found_keyword = None

        for keyword in data["keywords"]:

            if keyword.lower() in text_lower:

                found_keyword = keyword
                break

        if found_keyword:

            clause_text = find_clause(
                text,
                data["keywords"]
            )

            total_risk += data["risk"]

            if data["risk"] >= 20:
                risk = "High"

            elif data["risk"] >= 15:
                risk = "Medium"

            else:
                risk = "Low"

            clauses.append({
                "category": category,
                "risk": risk,
                "keyword": found_keyword,
                "description": clause_text
            })

        else:

            clauses.append({
                "category": category,
                "risk": "Not Found",
                "keyword": None,
                "description":
                    f"No clear {category.lower()} clause was detected."
            })


    # ==============================
    # RISK SCORE
    # ==============================

    risk_score = min(
        total_risk,
        100
    )

    if risk_score >= 70:

        risk_level = "HIGH RISK"

    elif risk_score >= 40:

        risk_level = "MEDIUM RISK"

    else:

        risk_level = "LOW RISK"


    # ==============================
    # WARNINGS
    # ==============================

    warnings = []

    if "automatic renewal" in text_lower:

        warnings.append(
            "Automatic renewal clause detected."
        )

    if "unlimited liability" in text_lower:

        warnings.append(
            "Unlimited liability clause detected."
        )

    if "penalty" in text_lower:

        warnings.append(
            "Penalty provision detected."
        )

    if "non-compete" in text_lower:

        warnings.append(
            "Non-compete restriction detected."
        )

    if "personal data" in text_lower:

        warnings.append(
            "Personal data provisions detected."
        )


    # ==============================
    # SUMMARY
    # ==============================

    summary = (
        f"The contract was reviewed across "
        f"{len(categories)} important categories. "
        f"The calculated risk score is "
        f"{risk_score}/100, classified as "
        f"{risk_level}."
    )


    # ==============================
    # FINAL RESULT
    # ==============================

    return {

        "risk_score": risk_score,

        "risk_level": risk_level,

        "summary": summary,

        "clauses": clauses,

        "warnings": warnings,

        "text_length": len(text),

        "word_count": len(text.split())
    }


# ==============================
# UPLOAD CONTRACT
# ==============================

@app.post("/upload")
async def upload_contract(
    file: UploadFile = File(...)
):

    filename = file.filename

    extension = os.path.splitext(
        filename
    )[1].lower()


    # ==============================
    # CHECK FILE TYPE
    # ==============================

    if extension not in [
        ".pdf",
        ".docx"
    ]:

        return {
            "success": False,
            "error":
                "Only PDF and DOCX files are supported."
        }


    # ==============================
    # READ FILE
    # ==============================

    contents = await file.read()


    # ==============================
    # CREATE TEMPORARY FILE
    # ==============================

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension
    )

    temp_file.write(contents)

    temp_file.close()


    try:

        # ==========================
        # EXTRACT TEXT
        # ==========================

        text = extract_text(
            temp_file.name,
            filename
        )


        # ==========================
        # ANALYZE CONTRACT
        # ==========================

        analysis = analyze_contract(
            text
        )


        # ==========================
        # SEND RESULT
        # ==========================

        return {

            "success": True,

            "filename": filename,

            "message":
                "Contract analyzed successfully.",

            "analysis": analysis

        }


    except Exception as e:

        return {

            "success": False,

            "error": str(e)

        }


    finally:

        if os.path.exists(
            temp_file.name
        ):

            os.remove(
                temp_file.name
            )