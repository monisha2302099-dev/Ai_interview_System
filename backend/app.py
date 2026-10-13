"""FastAPI service for the interview preparation chatbot."""

from __future__ import annotations

import os
import tempfile
import zipfile
from pathlib import Path
from typing import Any

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf.errors import PdfReadError
from docx.opc.exceptions import PackageNotFoundError
from starlette.concurrency import run_in_threadpool

from backend.chatbot.conversation import ConversationManager
from backend.chatbot.inference import InferenceEngine
from backend.chatbot.interview_dataset import InterviewDataset
from backend.chatbot.retrieval import QuestionBankRetriever
from backend.resume.analyzer import analyze_resume
from backend.resume.parser import extract_resume, extract_resume_file

from backend.chatbot.model_router import SubjectModelRouter
#from backend.chatbot.retrieval import QuestionBankRetriever
#from backend.chatbot.conversation import ConversationManager

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str | None = Field(default=None, max_length=128)


class ChatResponse(BaseModel):
    response: str
    session_id: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class QuestionGenerationRequest(BaseModel):
    job_role: str | None = Field(default=None, min_length=1, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=20)
    subject: str | None = Field(default=None, min_length=1, max_length=100)
    difficulty: str | None = None
    count: int = Field(default=5, ge=1, le=50)


class AnswerEvaluationRequest(BaseModel):
    question_id: str = Field(min_length=1, max_length=200)
    answer: str = Field(min_length=1, max_length=10000)


class ChatService:
    def __init__(self, manager: ConversationManager | None = None) -> None:
        self.manager = manager

    @property
    def model_loaded(self) -> bool:
        if self.manager is None:
            return False
        return bool(getattr(self.manager.generator, "model_loaded", True))

    def chat(self, request: ChatRequest) -> dict[str, str]:
        if self.manager is None:
            raise HTTPException(
                status_code=503,
                detail="Model is not loaded. Configure INTERVIEW_CHECKPOINT and INTERVIEW_VOCABULARY.",
            )
        try:
            return self.manager.chat(request.message, request.session_id)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc


def create_app(
    *,
    manager: ConversationManager | None = None,
    checkpoint_path: str | Path | None = None,
    vocabulary_path: str | Path | None = None,
    device: torch.device | None = None,
) -> FastAPI:
    service = ChatService(manager)
    interview_dataset = InterviewDataset()
    if service.manager is None and checkpoint_path and vocabulary_path:
        engine = InferenceEngine.from_checkpoint(checkpoint_path, vocabulary_path, device=device)
        service.manager = ConversationManager(engine, retriever=QuestionBankRetriever())

    app = FastAPI(title="AI Interview Preparation System", version="0.1.0")
    app.state.chat_service = service
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok", model_loaded=service.model_loaded)

    @app.post("/chat", response_model=ChatResponse)
    def chat(request: ChatRequest) -> ChatResponse:
        result = service.chat(request)
        return ChatResponse(**result)

    @app.get("/interview/subjects")
    def interview_subjects() -> dict[str, list[str]]:
        return {"subjects": interview_dataset.subjects()}

    @app.get("/interview/job-roles")
    def interview_job_roles() -> dict[str, dict[str, Any]]:
        return interview_dataset.job_roles()

    @app.post("/interview/questions")
    def generate_interview_questions(request: QuestionGenerationRequest) -> dict[str, Any]:
        try:
            questions = interview_dataset.generate_questions(
                job_role=request.job_role,
                skills=request.skills,
                subject=request.subject,
                difficulty=request.difficulty,
                count=request.count,
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        return {"questions": questions, "count": len(questions)}

    @app.post("/interview/evaluate")
    def evaluate_interview_answer(request: AnswerEvaluationRequest) -> dict[str, Any]:
        try:
            return interview_dataset.evaluate_answer(request.question_id, request.answer)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    @app.post("/resume/analyze")
    async def analyze_resume_endpoint(
        file: UploadFile | None = File(default=None),
        resume_text: str | None = Form(default=None, max_length=100_000),
        target_role: str = Form(default="Software Engineer", max_length=100),
        job_description: str = Form(default="", max_length=20_000),
    ) -> dict[str, Any]:
        if bool(file) == bool(resume_text and resume_text.strip()):
            raise HTTPException(status_code=422, detail="Provide exactly one resume file or resume_text.")

        filename = file.filename if file else "pasted-resume.txt"
        try:
            if file:
                suffix = Path(file.filename or "").suffix.lower()
                if suffix not in {".txt", ".pdf", ".docx"}:
                    raise HTTPException(
                        status_code=415,
                        detail="Only PDF, DOCX, and TXT resumes are supported.",
                    )
                content = await file.read(5 * 1024 * 1024 + 1)
                if len(content) > 5 * 1024 * 1024:
                    raise HTTPException(status_code=413, detail="Resume file must be 5 MB or smaller.")
                with tempfile.NamedTemporaryFile(suffix=suffix) as temporary_file:
                    temporary_file.write(content)
                    temporary_file.flush()
                    extracted = await run_in_threadpool(extract_resume_file, temporary_file.name)
                source_text = extracted["text"]
                profile = extracted["profile"]
            else:
                source_text = resume_text or ""
                profile = extract_resume(source_text)
        except HTTPException:
            raise
        except (ValueError, OSError, UnicodeDecodeError, PdfReadError, PackageNotFoundError, zipfile.BadZipFile) as exc:
            raise HTTPException(status_code=422, detail=f"Could not read resume: {exc}") from exc

        if len(source_text.strip()) < 30:
            raise HTTPException(
                status_code=422,
                detail="No readable resume text was found. If this is a scanned PDF, use a text-based PDF or paste the resume text.",
            )

        result = analyze_resume(
            source_text,
            target_role=target_role.strip() or "Software Engineer",
            job_description=job_description,
        )
        result.pop("profile", None)
        return {"filename": filename, "profile": profile, "analysis": result}

    @app.get("/sessions/{session_id}/messages")
    def history(session_id: str) -> dict[str, Any]:
        if service.manager is None:
            raise HTTPException(status_code=503, detail="Model is not loaded.")
        return {"session_id": session_id, "messages": service.manager.get_history(session_id)}

    @app.delete("/sessions/{session_id}", status_code=204)
    def clear_session(session_id: str) -> None:
        if service.manager is not None:
            service.manager.clear(session_id)

    return app



def _default_app() -> FastAPI:
    vocabulary = os.getenv(
        "INTERVIEW_VOCABULARY",
        "backend/data/processed/vocab.json",
    )

    router = SubjectModelRouter(
        vocabulary_path=vocabulary,
        checkpoint_directory="checkpoints",
    )

    manager = ConversationManager(
        router,
        retriever=QuestionBankRetriever(),
    )

    return create_app(manager=manager)


app = _default_app()
