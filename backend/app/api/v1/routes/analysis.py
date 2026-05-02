from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user, get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, WeaknessAnalysis
from app.services.analysis_service import analyze_user

router = APIRouter()


@router.get("/{user_id}", response_model=WeaknessAnalysis)
def get_analysis(
    user_id: str,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> WeaknessAnalysis:
    return analyze_user(resolve_user_id(user_id, user))


@router.get("/me/summary", response_model=WeaknessAnalysis)
def get_my_analysis(user: Annotated[AuthUser, Depends(get_current_user)]) -> WeaknessAnalysis:
    return analyze_user(user.id)
