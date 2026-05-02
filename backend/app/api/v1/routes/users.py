from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_optional_user, resolve_user_id
from app.db.repository import get_profile as fetch_profile
from app.db.repository import save_profile
from app.schemas.study import AuthUser, StudentProfile, StudentProfileCreate

router = APIRouter()


@router.post("/profile", response_model=StudentProfile, status_code=status.HTTP_201_CREATED)
def create_or_update_profile(
    payload: StudentProfileCreate,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> StudentProfile:
    user_id = resolve_user_id(payload.user_id, user)
    profile = StudentProfile(**payload.model_dump(exclude={"user_id"}), user_id=user_id, created_at=datetime.now(timezone.utc))
    save_profile(profile)
    return profile


@router.get("/profile/{user_id}", response_model=StudentProfile)
def get_profile(
    user_id: str,
    user: Annotated[AuthUser | None, Depends(get_optional_user)] = None,
) -> StudentProfile:
    resolved_user_id = resolve_user_id(user_id, user)
    profile = fetch_profile(resolved_user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.get("/me/profile", response_model=StudentProfile)
def get_my_profile(user: Annotated[AuthUser, Depends(get_optional_user)]) -> StudentProfile:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login required.")
    profile = fetch_profile(user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile
