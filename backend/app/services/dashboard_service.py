from app.db.repository import list_attempts, list_revisions
from app.schemas.study import DashboardResponse
from app.services.analysis_service import get_mastery


def get_dashboard(user_id: str) -> DashboardResponse:
    attempts = list_attempts(user_id)
    total_score = sum(attempt.score for attempt in attempts)
    total_questions = sum(attempt.total for attempt in attempts)
    mastery = get_mastery(user_id)
    return DashboardResponse(
        user_id=user_id,
        overall_accuracy=round(total_score / total_questions, 2) if total_questions else 0,
        mastery_by_topic=mastery,
        weak_topics=[item.topic for item in mastery if item.status == "weak"],
        study_streak_days=min(len(attempts), 7),
        upcoming_revisions=list_revisions(user_id),
    )
