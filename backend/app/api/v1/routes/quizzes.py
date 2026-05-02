from fastapi import APIRouter

from app.schemas.study import Quiz, QuizGenerateRequest
from app.services.quiz_service import generate_quiz

router = APIRouter()


@router.post("/generate", response_model=Quiz)
def create_quiz(payload: QuizGenerateRequest) -> Quiz:
    return generate_quiz(payload)
