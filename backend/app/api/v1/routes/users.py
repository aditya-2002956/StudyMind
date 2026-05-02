from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.db.repository import get_profile as fetch_profile
from app.db.repository import save_profile
from app.schemas.study import StudentProfile, StudentProfileCreate

router = APIRouter()


@router.post("/profile", response_model=StudentProfile, status_code=status.HTTP_201_CREATED)
def create_or_update_profile(payload: StudentProfileCreate) -> StudentProfile:
    profile = StudentProfile(**payload.model_dump(), created_at=datetime.now(timezone.utc))
    save_profile(profile)
    return profile


@router.get("/profile/{user_id}", response_model=StudentProfile)
def get_profile(user_id: str) -> StudentProfile:
    profile = fetch_profile(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile
