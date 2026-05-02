from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.auth import get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, Difficulty, Quiz, QuizGenerateRequest
from app.services.pdf_quiz_service import generate_quiz_from_pdf_bytes
from app.services.quiz_service import generate_quiz

router = APIRouter()


@router.post("/generate", response_model=Quiz)
def create_quiz(
    payload: QuizGenerateRequest,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> Quiz:
    payload.user_id = resolve_user_id(payload.user_id, user)
    return generate_quiz(payload)


@router.post("/from-pdf", response_model=Quiz)
async def create_quiz_from_pdf(
    file: UploadFile = File(...),
    user_id: str = Form(default="demo-user"),
    subject: str = Form(default="Uploaded PDF"),
    question_count: int = Form(default=5),
    difficulty: Difficulty = Form(default=Difficulty.medium),
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> Quiz:
    resolved_user_id = resolve_user_id(user_id, user)
    if file.content_type not in {"application/pdf", "application/x-pdf"} and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a PDF file.",
        )
    if question_count < 1 or question_count > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="question_count must be between 1 and 20.",
        )

    pdf_bytes = await file.read()
    if len(pdf_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF is too large. Please upload a file under 15 MB.",
        )

    try:
        return generate_quiz_from_pdf_bytes(
            pdf_bytes=pdf_bytes,
            user_id=resolved_user_id,
            subject=subject,
            question_count=question_count,
            difficulty=difficulty,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
