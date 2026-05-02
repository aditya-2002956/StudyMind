from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_optional_user, resolve_user_id
from app.schemas.study import AttemptCreate, AttemptResult, AuthUser
from app.services.analysis_service import score_attempt

router = APIRouter()


@router.post("", response_model=AttemptResult)
def submit_attempt(
    payload: AttemptCreate,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> AttemptResult:
    payload.user_id = resolve_user_id(payload.user_id, user)
    return score_attempt(payload)
