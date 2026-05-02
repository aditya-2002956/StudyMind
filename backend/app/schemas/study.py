from datetime import date, datetime
from enum import Enum
from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class LearningPace(str, Enum):
    slow = "slow"
    normal = "normal"
    fast = "fast"


class SubjectSelection(BaseModel):
    subject: str
    goal: str = "Improve exam score"
    target_exam_date: date | None = None
    weekly_hours: int = Field(default=7, ge=1, le=80)


class StudentProfileCreate(BaseModel):
    user_id: str
    name: str
    grade_level: str = "college"
    learning_pace: LearningPace = LearningPace.normal
    subjects: list[SubjectSelection]


class StudentProfile(StudentProfileCreate):
    created_at: datetime


class AuthUser(BaseModel):
    id: str
    email: str | None = None
    role: str | None = None
    is_demo: bool = False


class QuizGenerateRequest(BaseModel):
    user_id: str
    subject: str
    topics: list[str] = Field(default_factory=list)
    question_count: int = Field(default=5, ge=1, le=20)
    difficulty: Difficulty = Difficulty.medium


class QuizQuestion(BaseModel):
    id: str
    subject: str
    topic: str
    difficulty: Difficulty
    prompt: str
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)
    explanation: str


class Quiz(BaseModel):
    id: str
    user_id: str
    subject: str
    questions: list[QuizQuestion]
    created_at: datetime


class AnswerSubmission(BaseModel):
    question_id: str
    selected_option_index: int = Field(ge=0, le=3)
    time_taken_seconds: int = Field(default=60, ge=1, le=3600)
    confidence: int = Field(default=3, ge=1, le=5)


class AttemptCreate(BaseModel):
    user_id: str
    quiz_id: str
    answers: list[AnswerSubmission]


class TopicPerformance(BaseModel):
    topic: str
    attempted: int
    correct: int
    accuracy: float
    avg_time_seconds: float
    mastery_score: float
    status: str


class AttemptResult(BaseModel):
    attempt_id: str
    user_id: str
    quiz_id: str
    score: int
    total: int
    accuracy: float
    topic_performance: list[TopicPerformance]
    weak_topics: list[str]
    created_at: datetime


class WeaknessAnalysis(BaseModel):
    user_id: str
    weak_topics: list[TopicPerformance]
    strong_topics: list[TopicPerformance]
    recommendation: str


class PlannerRequest(BaseModel):
    user_id: str
    subject: str
    days: int = Field(default=7, ge=1, le=30)
    minutes_per_day: int = Field(default=60, ge=15, le=360)


class StudyTask(BaseModel):
    day: int
    topic: str
    task_type: str
    minutes: int
    reason: str


class StudyPlan(BaseModel):
    user_id: str
    subject: str
    days: int
    tasks: list[StudyTask]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    user_id: str
    subject: str
    topic: str | None = None
    message: str
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    suggested_next_step: str
    used_context: list[str]
    provider: str = "local"


class RevisionCard(BaseModel):
    user_id: str
    topic: str
    subject: str
    due_date: date
    interval_days: int
    ease_factor: float


class DashboardResponse(BaseModel):
    user_id: str
    overall_accuracy: float
    mastery_by_topic: list[TopicPerformance]
    weak_topics: list[str]
    study_streak_days: int
    upcoming_revisions: list[RevisionCard]
