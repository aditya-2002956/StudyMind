from __future__ import annotations

from hashlib import sha1
from typing import Any

import httpx

from app.core.config import settings
from app.db.memory import store
from app.schemas.study import AttemptResult, OnboardingResult, Quiz, RevisionCard, StudentProfile


class SupabaseError(RuntimeError):
    pass


class SupabaseRepository:
    def __init__(self, url: str, anon_key: str) -> None:
        self.base_url = url.rstrip("/")
        self.headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }

    def _request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        json: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer

        response = httpx.request(
            method,
            f"{self.base_url}/rest/v1/{table}",
            headers=headers,
            params=params,
            json=json,
            timeout=10,
        )
        if response.status_code >= 400:
            raise SupabaseError(f"Supabase {table} request failed: {response.text}")
        if response.content:
            return response.json()
        return None

    def save_profile(self, profile: StudentProfile) -> None:
        self._request(
            "POST",
            "studymind_profiles",
            params={"on_conflict": "user_id"},
            json={
                "user_id": profile.user_id,
                "payload": profile.model_dump(mode="json"),
                "created_at": profile.created_at.isoformat(),
            },
            prefer="resolution=merge-duplicates",
        )

    def get_profile(self, user_id: str) -> StudentProfile | None:
        rows = self._request(
            "GET",
            "studymind_profiles",
            params={"user_id": f"eq.{user_id}", "select": "payload", "limit": "1"},
        )
        return StudentProfile.model_validate(rows[0]["payload"]) if rows else None

    def save_onboarding(self, result: OnboardingResult) -> None:
        self._request(
            "POST",
            "studymind_onboarding",
            params={"on_conflict": "user_id"},
            json={
                "user_id": result.user_id,
                "payload": result.model_dump(mode="json"),
                "created_at": result.created_at.isoformat(),
            },
            prefer="resolution=merge-duplicates",
        )

    def get_onboarding(self, user_id: str) -> OnboardingResult | None:
        rows = self._request(
            "GET",
            "studymind_onboarding",
            params={"user_id": f"eq.{user_id}", "select": "payload", "limit": "1"},
        )
        return OnboardingResult.model_validate(rows[0]["payload"]) if rows else None

    def save_quiz(self, quiz: Quiz) -> None:
        self._request(
            "POST",
            "studymind_quizzes",
            params={"on_conflict": "id"},
            json={
                "id": quiz.id,
                "user_id": quiz.user_id,
                "subject": quiz.subject,
                "payload": quiz.model_dump(mode="json"),
                "created_at": quiz.created_at.isoformat(),
            },
            prefer="resolution=merge-duplicates",
        )

    def get_quiz(self, quiz_id: str) -> Quiz | None:
        rows = self._request(
            "GET",
            "studymind_quizzes",
            params={"id": f"eq.{quiz_id}", "select": "payload", "limit": "1"},
        )
        return Quiz.model_validate(rows[0]["payload"]) if rows else None

    def add_attempt(self, attempt: AttemptResult) -> None:
        self._request(
            "POST",
            "studymind_attempts",
            params={"on_conflict": "attempt_id"},
            json={
                "attempt_id": attempt.attempt_id,
                "user_id": attempt.user_id,
                "quiz_id": attempt.quiz_id,
                "payload": attempt.model_dump(mode="json"),
                "created_at": attempt.created_at.isoformat(),
            },
            prefer="resolution=merge-duplicates",
        )

    def list_attempts(self, user_id: str) -> list[AttemptResult]:
        rows = self._request(
            "GET",
            "studymind_attempts",
            params={
                "user_id": f"eq.{user_id}",
                "select": "payload",
                "order": "created_at.asc",
            },
        )
        return [AttemptResult.model_validate(row["payload"]) for row in rows]

    def list_revisions(self, user_id: str) -> list[RevisionCard]:
        rows = self._request(
            "GET",
            "studymind_revisions",
            params={
                "user_id": f"eq.{user_id}",
                "select": "payload",
                "order": "due_date.asc",
            },
        )
        return [RevisionCard.model_validate(row["payload"]) for row in rows]

    def add_revision_if_missing(self, card: RevisionCard) -> None:
        revision_id = _revision_id(card.user_id, card.subject, card.topic)
        self._request(
            "POST",
            "studymind_revisions",
            params={"on_conflict": "id"},
            json={
                "id": revision_id,
                "user_id": card.user_id,
                "subject": card.subject,
                "topic": card.topic,
                "due_date": card.due_date.isoformat(),
                "payload": card.model_dump(mode="json"),
            },
            prefer="resolution=ignore-duplicates",
        )


def _revision_id(user_id: str, subject: str, topic: str) -> str:
    raw = f"{user_id}:{subject}:{topic}".encode("utf-8")
    return sha1(raw).hexdigest()


def _supabase() -> SupabaseRepository | None:
    if not settings.use_supabase:
        return None
    return SupabaseRepository(settings.supabase_project_url or "", settings.supabase_key or "")


def save_profile(profile: StudentProfile) -> None:
    store.profiles[profile.user_id] = profile
    if repo := _supabase():
        repo.save_profile(profile)


def get_profile(user_id: str) -> StudentProfile | None:
    if repo := _supabase():
        profile = repo.get_profile(user_id)
        if profile:
            store.profiles[user_id] = profile
            return profile
    return store.profiles.get(user_id)


def save_onboarding(result: OnboardingResult) -> None:
    store.onboarding[result.user_id] = result
    store.profiles[result.user_id] = result.profile
    if repo := _supabase():
        repo.save_onboarding(result)
        repo.save_profile(result.profile)


def get_onboarding(user_id: str) -> OnboardingResult | None:
    if repo := _supabase():
        result = repo.get_onboarding(user_id)
        if result:
            store.onboarding[user_id] = result
            store.profiles[user_id] = result.profile
            return result
    return store.onboarding.get(user_id)


def save_quiz(quiz: Quiz) -> None:
    store.quizzes[quiz.id] = quiz
    if repo := _supabase():
        repo.save_quiz(quiz)


def get_quiz(quiz_id: str) -> Quiz | None:
    if repo := _supabase():
        quiz = repo.get_quiz(quiz_id)
        if quiz:
            store.quizzes[quiz_id] = quiz
            return quiz
    return store.quizzes.get(quiz_id)


def add_attempt(attempt: AttemptResult) -> None:
    store.attempts.setdefault(attempt.user_id, []).append(attempt)
    if repo := _supabase():
        repo.add_attempt(attempt)


def list_attempts(user_id: str) -> list[AttemptResult]:
    if repo := _supabase():
        attempts = repo.list_attempts(user_id)
        store.attempts[user_id] = attempts
        return attempts
    return store.attempts.get(user_id, [])


def list_revisions(user_id: str) -> list[RevisionCard]:
    if repo := _supabase():
        revisions = repo.list_revisions(user_id)
        store.revisions[user_id] = revisions
        return revisions
    return store.revisions.get(user_id, [])


def add_revision_if_missing(card: RevisionCard) -> None:
    cards = store.revisions.setdefault(card.user_id, [])
    exists = any(existing.subject == card.subject and existing.topic == card.topic for existing in cards)
    if not exists:
        cards.append(card)
    if repo := _supabase():
        repo.add_revision_if_missing(card)


def supabase_status() -> dict[str, Any]:
    if not settings.use_supabase:
        return {"enabled": False, "connected": False, "message": "Supabase is disabled or not configured."}

    try:
        repo = SupabaseRepository(settings.supabase_project_url or "", settings.supabase_key or "")
        repo._request("GET", "studymind_profiles", params={"select": "user_id", "limit": "1"})
    except Exception as exc:
        return {"enabled": True, "connected": False, "message": str(exc)}

    return {"enabled": True, "connected": True, "message": "Supabase tables are reachable."}
