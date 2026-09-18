from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models  # noqa: F401

from routers import auth_router, upload, documents, analyze

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Contract Review System",
    description="Backend API for AI-powered contract analysis",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # Production frontend on Vercel
        "https://contractreviewai.vercel.app",
    ],
    # Allow all Vercel preview URLs (branch deploys get random subdomains)
    allow_origin_regex=r"https://contractreviewai-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(analyze.router)


@app.get("/")
def home():
    return {
        "message": "AI Contract Review API is running",
        "status": "success",
        "version": "2.1.0",
    }
