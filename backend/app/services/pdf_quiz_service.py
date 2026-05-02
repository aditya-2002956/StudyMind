from datetime import datetime, timezone
from io import BytesIO
from uuid import uuid4

from app.db.repository import save_quiz
from app.schemas.study import Difficulty, Quiz
from app.services.ai_provider import ai_provider


def generate_quiz_from_pdf_bytes(
    *,
    pdf_bytes: bytes,
    user_id: str,
    subject: str,
    question_count: int,
    difficulty: Difficulty,
) -> Quiz:
    text = _extract_pdf_text(pdf_bytes)
    if len(text.strip()) < 120:
        raise ValueError("Could not read enough text from this PDF. Try a text-based PDF instead of a scanned image.")

    quiz_subject = _subject_from_text(text, subject)
    questions = ai_provider.generate_quiz_questions_from_text(
        subject=quiz_subject,
        source_text=text,
        question_count=question_count,
        difficulty=difficulty,
    )
    quiz = Quiz(
        id=f"quiz-{uuid4().hex[:8]}",
        user_id=user_id,
        subject=quiz_subject,
        questions=questions,
        created_at=datetime.now(timezone.utc),
    )
    save_quiz(quiz)
    return quiz


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF support is not installed. Run pip install pypdf python-multipart.") from exc

    reader = PdfReader(BytesIO(pdf_bytes))
    pages: list[str] = []
    for page in reader.pages[:30]:
        pages.append(page.extract_text() or "")
    return "\n\n".join(pages)[:50000]


def _subject_from_text(text: str, fallback: str) -> str:
    cleaned_fallback = (fallback or "").strip()
    upper_text = text.upper()
    if "PERMUTATIONS AND COMBINATIONS" in upper_text:
        return "Permutations and Combinations"
    if "TRIGONOMETRIC FUNCTIONS" in upper_text or "TRIGONOMETRIC RATIOS" in upper_text:
        return "Trigonometric Functions"
    if cleaned_fallback and cleaned_fallback.lower() not in {"uploaded pdf", "kemh106"}:
        return cleaned_fallback
    for line in text.splitlines():
        line = line.strip()
        if len(line) > 6 and line.isupper() and "MATHEMATICS" not in line:
            return line.title()
    return cleaned_fallback or "Uploaded PDF"
