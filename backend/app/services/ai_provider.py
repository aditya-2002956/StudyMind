import httpx

from app.core.config import settings
from app.schemas.study import ChatMessage, Difficulty, QuizQuestion


class AIProvider:
    """AI adapter with Gemini for tutor chat and deterministic local fallback."""

    def generate_quiz_questions(
        self,
        subject: str,
        topics: list[str],
        question_count: int,
        difficulty: Difficulty,
    ) -> list[QuizQuestion]:
        if not topics:
            topics = ["fundamentals", "application", "revision"]

        questions: list[QuizQuestion] = []
        for index in range(question_count):
            topic = topics[index % len(topics)]
            correct_index = index % 4
            questions.append(
                QuizQuestion(
                    id=f"q-{subject.lower().replace(' ', '-')}-{topic.lower().replace(' ', '-')}-{index + 1}",
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    prompt=(
                        f"In {subject}, which option best checks understanding of "
                        f"{topic} at {difficulty.value} level?"
                    ),
                    options=[
                        f"{topic} core definition",
                        f"{topic} common misconception",
                        f"{topic} unrelated fact",
                        f"{topic} shortcut without reasoning",
                    ],
                    correct_option_index=correct_index,
                    explanation=(
                        f"The best answer is option {correct_index + 1} because it tests the "
                        f"main concept behind {topic}, not just memorization."
                    ),
                )
            )
        return questions

    def tutor_answer(
        self,
        subject: str,
        topic: str | None,
        message: str,
        weak_topics: list[str],
        history: list[ChatMessage] | None = None,
    ) -> tuple[str, str]:
        if settings.gemini_api_key:
            try:
                return self._gemini_socratic_tutor(
                    subject=subject,
                    topic=topic,
                    message=message,
                    weak_topics=weak_topics,
                    history=history or [],
                ), "gemini"
            except Exception:
                return self._local_socratic_tutor(subject, topic, message, weak_topics), "local-fallback"

        return self._local_socratic_tutor(subject, topic, message, weak_topics), "local"

    def _local_socratic_tutor(
        self,
        subject: str,
        topic: str | None,
        message: str,
        weak_topics: list[str],
    ) -> str:
        focus = topic or (weak_topics[0] if weak_topics else "the current concept")
        return (
            f"Let's reason through {focus} in {subject}. You asked: '{message}'.\n\n"
            "First question: what information is given in the problem, and what are you trying to find?\n"
            "Hint: write the known values on one side and the unknown on the other. "
            "After that, tell me which rule or formula you think might connect them."
        )

    def _gemini_socratic_tutor(
        self,
        subject: str,
        topic: str | None,
        message: str,
        weak_topics: list[str],
        history: list[ChatMessage],
    ) -> str:
        focus = topic or (weak_topics[0] if weak_topics else "the student's current topic")
        weak_context = ", ".join(weak_topics[:5]) if weak_topics else "No weak topics detected yet."
        contents = self._gemini_history(history)
        contents.append(
            {
                "role": "user",
                "parts": [
                    {
                        "text": (
                            f"Subject: {subject}\n"
                            f"Focus topic: {focus}\n"
                            f"Known weak topics: {weak_context}\n"
                            f"Student question: {message}"
                        )
                    }
                ],
            }
        )

        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are StudyMind, an AI Socratic Tutor for students. "
                            "Do not immediately give final answers unless the student explicitly asks for a final check. "
                            "Guide with one or two targeted questions, small hints, and short explanations. "
                            "Adapt to the student's weak topics. Keep the tone encouraging and simple. "
                            "If the student asks for a solution, reveal it step by step and pause with a question. "
                            "Never fabricate textbook citations or claim to know the student's unseen syllabus."
                        )
                    }
                ]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.45,
                "topP": 0.9,
                "maxOutputTokens": 450,
            },
        }

        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.gemini_api_key or "",
            },
            json=payload,
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
        parts = data["candidates"][0]["content"]["parts"]
        return "\n".join(part.get("text", "") for part in parts).strip()

    def _gemini_history(self, history: list[ChatMessage]) -> list[dict[str, object]]:
        contents: list[dict[str, object]] = []
        for item in history[-8:]:
            role = "model" if item.role == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": item.content}]})
        return contents


ai_provider = AIProvider()
