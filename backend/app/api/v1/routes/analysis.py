from fastapi import APIRouter

from app.schemas.study import WeaknessAnalysis
from app.services.analysis_service import analyze_user

router = APIRouter()


@router.get("/{user_id}", response_model=WeaknessAnalysis)
def get_analysis(user_id: str) -> WeaknessAnalysis:
    return analyze_user(user_id)
