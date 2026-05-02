from app.services.analysis_service import get_mastery
from app.schemas.study import PlannerRequest, StudyPlan, StudyTask


def build_study_plan(payload: PlannerRequest) -> StudyPlan:
    mastery = get_mastery(payload.user_id)
    weak_topics = [item.topic for item in mastery if item.status == "weak"]
    improving_topics = [item.topic for item in mastery if item.status == "improving"]
    topics = weak_topics + improving_topics
    if not topics:
        topics = ["baseline diagnostic quiz", "concept revision", "mixed practice"]

    tasks: list[StudyTask] = []
    for day in range(1, payload.days + 1):
        topic = topics[(day - 1) % len(topics)]
        revision_minutes = max(10, payload.minutes_per_day // 4)
        concept_minutes = max(15, payload.minutes_per_day // 2)
        practice_minutes = max(10, payload.minutes_per_day - revision_minutes - concept_minutes)
        tasks.extend(
            [
                StudyTask(
                    day=day,
                    topic=topic,
                    task_type="concept_review",
                    minutes=concept_minutes,
                    reason="This topic has the lowest current mastery score.",
                ),
                StudyTask(
                    day=day,
                    topic=topic,
                    task_type="practice",
                    minutes=practice_minutes,
                    reason="Practice converts understanding into exam performance.",
                ),
                StudyTask(
                    day=day,
                    topic=topic,
                    task_type="spaced_revision",
                    minutes=revision_minutes,
                    reason="Short revision prevents forgetting before the next quiz.",
                ),
            ]
        )

    return StudyPlan(
        user_id=payload.user_id,
        subject=payload.subject,
        days=payload.days,
        tasks=tasks,
    )
