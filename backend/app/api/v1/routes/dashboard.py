from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user, get_optional_user, resolve_user_id
from app.schemas.study import AuthUser, DashboardResponse
from app.services.dashboard_service import get_dashboard

router = APIRouter()


@router.get("/{user_id}", response_model=DashboardResponse)
def dashboard(
    user_id: str,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> DashboardResponse:
    return get_dashboard(resolve_user_id(user_id, user))


@router.get("/me/summary", response_model=DashboardResponse)
def my_dashboard(user: Annotated[AuthUser, Depends(get_current_user)]) -> DashboardResponse:
    return get_dashboard(user.id)
