from fastapi import APIRouter

from app.api.v1.routes import analysis, attempts, auth, chat, dashboard, materials, onboarding, planner, quizzes, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(attempts.router, prefix="/attempts", tags=["attempts"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
api_router.include_router(planner.router, prefix="/planner", tags=["planner"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
