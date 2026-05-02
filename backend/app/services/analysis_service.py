from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.db.repository import add_attempt, add_revision_if_missing, get_quiz, list_attempts
from app.schemas.study import (
    AttemptCreate,
    AttemptResult,
    RevisionCard,
    TopicPerformance,
    WeaknessAnalysis,
)


def _status_from_mastery(mastery: float) -> str:
    if mastery >= 0.8:
        return "strong"
    if mastery >= 0.55:
        return "improving"
    return "weak"


def score_attempt(payload: AttemptCreate) -> AttemptResult:
    quiz = get_quiz(payload.quiz_id)
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    question_map = {question.id: question for question in quiz.questions}
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"attempted": 0, "correct": 0, "time": 0})
    score = 0

    for answer in payload.answers:
        question = question_map.get(answer.question_id)
        if not question:
            continue

        is_correct = answer.selected_option_index == question.correct_option_index
        score += int(is_correct)
        topic_stats = grouped[question.topic]
        topic_stats["attempted"] += 1
        topic_stats["correct"] += int(is_correct)
        topic_stats["time"] += answer.time_taken_seconds

    topic_performance: list[TopicPerformance] = []
    for topic, stats in grouped.items():
        attempted = int(stats["attempted"])
        correct = int(stats["correct"])
        accuracy = correct / attempted if attempted else 0
        avg_time = stats["time"] / attempted if attempted else 0
        speed_penalty = min(avg_time / 240, 0.2)
        mastery = max(0, min(1, accuracy - speed_penalty))
        topic_performance.append(
            TopicPerformance(
                topic=topic,
                attempted=attempted,
                correct=correct,
                accuracy=round(accuracy, 2),
                avg_time_seconds=round(avg_time, 1),
                mastery_score=round(mastery, 2),
                status=_status_from_mastery(mastery),
            )
        )

    total = len(payload.answers)
    result = AttemptResult(
        attempt_id=f"attempt-{uuid4().hex[:8]}",
        user_id=payload.user_id,
        quiz_id=payload.quiz_id,
        score=score,
        total=total,
        accuracy=round(score / total, 2) if total else 0,
        topic_performance=topic_performance,
        weak_topics=[item.topic for item in topic_performance if item.status == "weak"],
        created_at=datetime.now(timezone.utc),
    )
    add_attempt(result)
    _schedule_revisions(payload.user_id, quiz.subject, result)
    return result


def analyze_user(user_id: str) -> WeaknessAnalysis:
    performances = _aggregate_performance(user_id)
    weak = [item for item in performances if item.status == "weak"]
    strong = [item for item in performances if item.status == "strong"]
    if weak:
        recommendation = f"Focus next session on {', '.join(item.topic for item in weak[:3])}."
    else:
        recommendation = "No major weak topic detected yet. Take another quiz to improve confidence."
    return WeaknessAnalysis(
        user_id=user_id,
        weak_topics=weak,
        strong_topics=strong,
        recommendation=recommendation,
    )


def _aggregate_performance(user_id: str) -> list[TopicPerformance]:
    attempts = list_attempts(user_id)
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"attempted": 0, "correct": 0, "time": 0})

    for attempt in attempts:
        for topic in attempt.topic_performance:
            data = grouped[topic.topic]
            data["attempted"] += topic.attempted
            data["correct"] += topic.correct
            data["time"] += topic.avg_time_seconds * topic.attempted

    performance: list[TopicPerformance] = []
    for topic, stats in grouped.items():
        attempted = int(stats["attempted"])
        correct = int(stats["correct"])
        accuracy = correct / attempted if attempted else 0
        avg_time = stats["time"] / attempted if attempted else 0
        mastery = max(0, min(1, accuracy - min(avg_time / 240, 0.2)))
        performance.append(
            TopicPerformance(
                topic=topic,
                attempted=attempted,
                correct=correct,
                accuracy=round(accuracy, 2),
                avg_time_seconds=round(avg_time, 1),
                mastery_score=round(mastery, 2),
                status=_status_from_mastery(mastery),
            )
        )

    return sorted(performance, key=lambda item: item.mastery_score)


def _schedule_revisions(user_id: str, subject: str, result: AttemptResult) -> None:
    for topic in result.weak_topics:
        add_revision_if_missing(
            RevisionCard(
                user_id=user_id,
                subject=subject,
                topic=topic,
                due_date=date.today() + timedelta(days=1),
                interval_days=1,
                ease_factor=2.5,
            )
        )


def get_mastery(user_id: str) -> list[TopicPerformance]:
    return _aggregate_performance(user_id)
