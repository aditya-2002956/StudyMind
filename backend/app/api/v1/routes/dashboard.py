from fastapi import APIRouter

from app.schemas.study import DashboardResponse
from app.services.dashboard_service import get_dashboard

router = APIRouter()


@router.get("/{user_id}", response_model=DashboardResponse)
def dashboard(user_id: str) -> DashboardResponse:
    return get_dashboard(user_id)
