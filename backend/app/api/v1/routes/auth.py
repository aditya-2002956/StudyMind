from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.schemas.study import AuthUser

router = APIRouter()


@router.get("/me", response_model=AuthUser)
def me(user: Annotated[AuthUser, Depends(get_current_user)]) -> AuthUser:
    return user
