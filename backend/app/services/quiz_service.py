from datetime import datetime, timezone
from uuid import uuid4

from app.db.repository import save_quiz
from app.schemas.study import Quiz, QuizGenerateRequest
from app.services.ai_provider import ai_provider


def generate_quiz(payload: QuizGenerateRequest) -> Quiz:
    questions = ai_provider.generate_quiz_questions(
        subject=payload.subject,
        topics=payload.topics,
        question_count=payload.question_count,
        difficulty=payload.difficulty,
    )
    quiz = Quiz(
        id=f"quiz-{uuid4().hex[:8]}",
        user_id=payload.user_id,
        subject=payload.subject,
        questions=questions,
        created_at=datetime.now(timezone.utc),
    )
    save_quiz(quiz)
    return quiz
