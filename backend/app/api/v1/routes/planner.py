from fastapi import APIRouter

from app.schemas.study import PlannerRequest, StudyPlan
from app.services.planner_service import build_study_plan

router = APIRouter()


@router.post("/generate", response_model=StudyPlan)
def generate_plan(payload: PlannerRequest) -> StudyPlan:
    return build_study_plan(payload)
