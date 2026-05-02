from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, Quiz, QuizGenerateRequest
from app.services.quiz_service import generate_quiz

router = APIRouter()


@router.post("/generate", response_model=Quiz)
def create_quiz(
    payload: QuizGenerateRequest,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> Quiz:
    payload.user_id = resolve_user_id(payload.user_id, user)
    return generate_quiz(payload)
