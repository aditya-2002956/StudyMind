from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, ChatRequest, ChatResponse
from app.services.ai_provider import ai_provider
from app.services.analysis_service import analyze_user

router = APIRouter()


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> ChatResponse:
    payload.user_id = resolve_user_id(payload.user_id, user)
    analysis_weak_topics: list[str] = []
    try:
        analysis = analyze_user(payload.user_id)
        analysis_weak_topics = [item.topic for item in analysis.weak_topics]
    except Exception:
        # The tutor should still work if Supabase history is temporarily
        # unavailable; the frontend sends recent weak-topic context too.
        analysis_weak_topics = []

    weak_topics = list(dict.fromkeys(analysis_weak_topics + payload.weak_topics))
    answer, provider = ai_provider.tutor_answer(
        subject=payload.subject,
        topic=payload.topic,
        message=payload.message,
        weak_topics=weak_topics,
        history=payload.history,
        context=payload.context,
    )
    return ChatResponse(
        answer=answer,
        suggested_next_step="Reply with your next step or where you got stuck, and the tutor will guide you one hint at a time.",
        used_context=weak_topics[:3],
        provider=provider,
    )
