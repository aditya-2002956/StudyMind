from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user, get_optional_user, resolve_user_id
from app.db.repository import get_onboarding
from app.schemas.study import AuthUser, OnboardingResult, OnboardingSurveyCreate
from app.services.onboarding_service import process_onboarding

router = APIRouter()


@router.post("/survey", response_model=OnboardingResult, status_code=status.HTTP_201_CREATED)
def submit_survey(
    payload: OnboardingSurveyCreate,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> OnboardingResult:
    payload.user_id = resolve_user_id(payload.user_id, user)
    return process_onboarding(payload)


@router.get("/{user_id}", response_model=OnboardingResult)
def get_survey_result(
    user_id: str,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> OnboardingResult:
    resolved_user_id = resolve_user_id(user_id, user)
    result = get_onboarding(resolved_user_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding result not found")
    return result


@router.get("/me/result", response_model=OnboardingResult)
def get_my_survey_result(user: Annotated[AuthUser, Depends(get_current_user)]) -> OnboardingResult:
    result = get_onboarding(user.id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding result not found")
    return result
