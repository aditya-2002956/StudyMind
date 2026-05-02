from app.schemas.study import AttemptResult, Quiz, RevisionCard, StudentProfile


class MemoryStore:
    def __init__(self) -> None:
        self.profiles: dict[str, StudentProfile] = {}
        self.quizzes: dict[str, Quiz] = {}
        self.attempts: dict[str, list[AttemptResult]] = {}
        self.revisions: dict[str, list[RevisionCard]] = {}


store = MemoryStore()
