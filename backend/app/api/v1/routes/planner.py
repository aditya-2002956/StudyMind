from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, PlannerRequest, StudyPlan
from app.services.planner_service import build_study_plan

router = APIRouter()


@router.post("/generate", response_model=StudyPlan)
def generate_plan(
    payload: PlannerRequest,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> StudyPlan:
    payload.user_id = resolve_user_id(payload.user_id, user)
    return build_study_plan(payload)
