from fastapi import APIRouter

from app.schemas.study import ChatRequest, ChatResponse
from app.services.ai_provider import ai_provider
from app.services.analysis_service import analyze_user

router = APIRouter()


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    analysis = analyze_user(payload.user_id)
    weak_topics = [item.topic for item in analysis.weak_topics]
    answer, provider = ai_provider.tutor_answer(
        subject=payload.subject,
        topic=payload.topic,
        message=payload.message,
        weak_topics=weak_topics,
        history=payload.history,
    )
    return ChatResponse(
        answer=answer,
        suggested_next_step="Reply with your next step or where you got stuck, and the tutor will guide you one hint at a time.",
        used_context=weak_topics[:3],
        provider=provider,
    )
