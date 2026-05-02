from fastapi import APIRouter

from app.schemas.study import AttemptCreate, AttemptResult
from app.services.analysis_service import score_attempt

router = APIRouter()


@router.post("", response_model=AttemptResult)
def submit_attempt(payload: AttemptCreate) -> AttemptResult:
    return score_attempt(payload)
