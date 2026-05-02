import json
import random
import re

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
        return self._randomize_questions(questions)

    def generate_quiz_questions_from_text(
        self,
        subject: str,
        source_text: str,
        question_count: int,
        difficulty: Difficulty,
    ) -> list[QuizQuestion]:
        chapter = self._chapter_profile(source_text, subject)
        subject = chapter["subject"]
        topics = chapter["topics"]
        internet_context = self._competitive_internet_context(subject, topics) if difficulty == Difficulty.competitive else []
        if settings.gemini_api_key:
            try:
                return self._randomize_questions(self._gemini_quiz_from_text(
                    subject=subject,
                    source_text=source_text,
                    topics=topics,
                    question_count=question_count,
                    difficulty=difficulty,
                    internet_context=internet_context,
                ))
            except Exception:
                pass
        return self._randomize_questions(self._local_quiz_from_text(subject, source_text, question_count, difficulty, topics))

    def tutor_answer(
        self,
        subject: str,
        topic: str | None,
        message: str,
        weak_topics: list[str],
        history: list[ChatMessage] | None = None,
        context: str | None = None,
    ) -> tuple[str, str]:
        if settings.gemini_api_key:
            try:
                return self._gemini_socratic_tutor(
                    subject=subject,
                    topic=topic,
                    message=message,
                    weak_topics=weak_topics,
                    history=history or [],
                    context=context,
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
        normalized = message.lower().strip()
        if any(phrase in normalized for phrase in ["i dont know", "i don't know", "idk", "no idea", "stuck", "confused"]):
            hint = self._starter_hint(subject, focus)
            return (
                f"No worries. When you do not know where to start, begin with the smallest useful idea in **{focus}**.\n\n"
                f"{hint}\n\n"
                "Try answering just this one question: what is the main object or process this topic is about?"
            )

        return (
            f"Let's work through **{focus}** in {subject}.\n\n"
            f"Your doubt: \"{message}\"\n\n"
            f"{self._starter_hint(subject, focus)}\n\n"
            "Now tell me: which part feels unclear: the definition, the formula/rule, or how to apply it in a question?"
        )

    def _starter_hint(self, subject: str, focus: str) -> str:
        text = f"{subject} {focus}".lower()
        if any(word in text for word in ["cell", "biology"]):
            return (
                "Think of a cell like a tiny working unit. First identify the part being discussed: "
                "cell membrane controls entry/exit, nucleus controls instructions, mitochondria release energy, "
                "and cytoplasm is where many reactions happen."
            )
        if any(word in text for word in ["permutation", "combination", "counting"]):
            return (
                "Ask: does order matter? If order matters, it is usually a permutation. "
                "If only selection matters, it is usually a combination."
            )
        if any(word in text for word in ["trigonometry", "trig", "sin", "cos", "tan"]):
            return (
                "Start from the triangle/unit-circle meaning: sin relates to vertical/opposite, "
                "cos to horizontal/adjacent, and tan is sin divided by cos."
            )
        if any(word in text for word in ["algebra", "equation", "polynomial"]):
            return (
                "First separate what is known from what is unknown. Then look for the operation that can undo the expression: "
                "addition/subtraction, multiplication/division, powers, or factoring."
            )
        return (
            "Break the topic into three pieces: definition, key rule, and one example. "
            "You only need the first piece before the rest starts making sense."
        )

    def _gemini_socratic_tutor(
        self,
        subject: str,
        topic: str | None,
        message: str,
        weak_topics: list[str],
        history: list[ChatMessage],
        context: str | None,
    ) -> str:
        focus = topic or (weak_topics[0] if weak_topics else "the student's current topic")
        weak_context = ", ".join(weak_topics[:5]) if weak_topics else "No weak topics detected yet."
        study_context = context.strip() if context else "No extra quiz/PDF/onboarding context was sent."
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
                            f"Student/app context: {study_context}\n"
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
                            "Your job is to make the student think, not to dump an answer. "
                            "Use the weak topics and app context to personalize the explanation. "
                            "Start with a brief diagnosis of what concept is being tested, then give one useful hint or micro-explanation. "
                            "Ask exactly one targeted question at the end unless the student explicitly asks for a final answer. "
                            "If the student asks for a solution, reveal it step by step and label the steps clearly. "
                            "For Indian students, prefer CBSE/NCERT, VTU, JEE, KCET, GATE, and semester-exam framing when relevant. "
                            "If the question is from an uploaded PDF, stay faithful to the provided context and say when more text is needed. "
                            "Never fabricate textbook citations, page numbers, URLs, or claim to know unseen material. "
                            "Keep the response concise, warm, and practical."
                        )
                    }
                ]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.55,
                "topP": 0.9,
                "maxOutputTokens": 650,
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

    def _gemini_quiz_from_text(
        self,
        subject: str,
        source_text: str,
        topics: list[str],
        question_count: int,
        difficulty: Difficulty,
        internet_context: list[str] | None = None,
    ) -> list[QuizQuestion]:
        trimmed_text = source_text[:12000]
        source_notes = "\n".join(internet_context or [])
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                "Read the study material, infer the chapter/topic, and create a real exam-style MCQ quiz.\n"
                                f"Subject: {subject}\n"
                                f"Difficulty: {difficulty.value}\n"
                                f"Question count: {question_count}\n"
                                f"Likely topics: {', '.join(topics)}\n\n"
                                f"Competitive source context, if any:\n{source_notes}\n\n"
                                "Return exactly this JSON shape, with no markdown:\n"
                                '{"questions":[{"topic":"...","prompt":"...","options":["...","...","...","..."],'
                                '"correct_option_index":0,"explanation":"..."}]}\n\n'
                                "Rules:\n"
                                "- Ask conceptual or numerical questions a teacher would ask after reading this chapter.\n"
                                "- If Difficulty is hard, ask application or multi-step questions, not basic recall.\n"
                                "- If Difficulty is competitive, ask JEE/CET/olympiad-style questions using multi-step reasoning and traps.\n"
                                "- For competitive mode, use the source context for topic style, but rewrite questions freshly.\n"
                                "- Do not ask sentence-matching questions.\n"
                                "- Do not start prompts with 'According to the uploaded material'.\n"
                                "- Use chapter examples, formulas, definitions, and common mistakes.\n"
                                "- Every question must have exactly 4 options.\n"
                                "- correct_option_index must be 0, 1, 2, or 3.\n"
                                "- topic must be a meaningful syllabus topic, not a random word.\n\n"
                                f"Material:\n{trimmed_text}"
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "temperature": 0.35,
                "topP": 0.9,
                "maxOutputTokens": 2500,
                "responseMimeType": "application/json",
            },
        }

        response = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent",
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": settings.gemini_api_key or "",
            },
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        text = "\n".join(
            part.get("text", "")
            for part in data["candidates"][0]["content"]["parts"]
        ).strip()
        parsed = json.loads(self._strip_json_fence(text))
        questions = parsed.get("questions", [])

        quiz_questions: list[QuizQuestion] = []
        for index, item in enumerate(questions[:question_count]):
            options = [str(option) for option in item.get("options", [])][:4]
            if len(options) != 4:
                continue
            correct_index = int(item.get("correct_option_index", 0))
            if correct_index < 0 or correct_index > 3:
                correct_index = 0
            topic = str(item.get("topic") or topics[index % len(topics)] if topics else "PDF material")
            prompt = str(item.get("prompt") or f"What is a key idea in {topic}?")
            if prompt.lower().startswith("according to the uploaded material"):
                continue
            quiz_questions.append(
                QuizQuestion(
                    id=f"q-pdf-{index + 1}",
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    prompt=prompt,
                    options=options,
                    correct_option_index=correct_index,
                    explanation=str(item.get("explanation") or "This answer is supported by the uploaded material."),
                )
            )

        if len(quiz_questions) < question_count:
            quiz_questions.extend(
                self._local_quiz_from_text(
                    subject,
                    source_text,
                    question_count - len(quiz_questions),
                    difficulty,
                    topics,
                    start_index=len(quiz_questions),
                )
            )
        return quiz_questions[:question_count]

    def _local_quiz_from_text(
        self,
        subject: str,
        source_text: str,
        question_count: int,
        difficulty: Difficulty,
        topics: list[str],
        start_index: int = 0,
    ) -> list[QuizQuestion]:
        text = source_text.lower()
        if "permutations and combinations" in text or "fundamental principle of counting" in text:
            return self._permutation_combination_questions(subject, difficulty, question_count, start_index)
        if "trigonometric functions" in text or "trigonometric ratios" in text or "radian" in text:
            return self._trigonometry_questions(subject, difficulty, question_count, start_index)

        return self._generic_chapter_questions(subject, difficulty, question_count, topics, start_index)

    def _permutation_combination_questions(
        self,
        subject: str,
        difficulty: Difficulty,
        question_count: int,
        start_index: int,
    ) -> list[QuizQuestion]:
        medium_bank = [
            {
                "topic": "Fundamental Principle of Counting",
                "prompt": "Mohan has 3 pants and 2 shirts. Using the multiplication principle from the chapter, how many pant-shirt pairs are possible?",
                "options": ["6", "5", "3", "2"],
                "correct": 0,
                "explanation": "For each of 3 pants, there are 2 shirt choices, so total pairs = 3 x 2 = 6.",
            },
            {
                "topic": "Fundamental Principle of Counting",
                "prompt": "Sabnam has 2 school bags, 3 tiffin boxes and 2 water bottles. If she chooses one of each, how many combinations of items can she carry?",
                "options": ["12", "7", "10", "6"],
                "correct": 0,
                "explanation": "Apply the multiplication principle: 2 x 3 x 2 = 12.",
            },
            {
                "topic": "Arrangements Without Repetition",
                "prompt": "How many 4-letter arrangements can be formed from the letters of ROSE when repetition is not allowed?",
                "options": ["24", "16", "64", "256"],
                "correct": 0,
                "explanation": "There are 4 choices, then 3, then 2, then 1, so 4 x 3 x 2 x 1 = 24.",
            },
            {
                "topic": "Arrangements With Repetition",
                "prompt": "If repetition is allowed, how many 4-letter arrangements can be formed from the letters of ROSE?",
                "options": ["256", "24", "16", "64"],
                "correct": 0,
                "explanation": "Each of the 4 places has 4 choices, so 4 x 4 x 4 x 4 = 256.",
            },
            {
                "topic": "Even Number Formation",
                "prompt": "How many 2-digit even numbers can be formed from 1, 2, 3, 4, 5 if digits can be repeated?",
                "options": ["10", "20", "8", "5"],
                "correct": 0,
                "explanation": "The units place has 2 choices, 2 or 4. The tens place has 5 choices. Total = 2 x 5 = 10.",
            },
            {
                "topic": "Signals With Flags",
                "prompt": "A signal uses 2 flags one below the other from 4 different flags. How many different signals are possible?",
                "options": ["12", "8", "16", "6"],
                "correct": 0,
                "explanation": "The upper place has 4 choices and the lower place has 3 remaining choices, so 4 x 3 = 12.",
            },
            {
                "topic": "At Least Cases",
                "prompt": "With 5 different flags, signals may use at least 2 flags on a vertical staff. The chapter adds 2-flag, 3-flag, 4-flag and 5-flag signals. What total does it get?",
                "options": ["320", "120", "300", "20"],
                "correct": 0,
                "explanation": "The total is 5x4 + 5x4x3 + 5x4x3x2 + 5x4x3x2x1 = 20 + 60 + 120 + 120 = 320.",
            },
            {
                "topic": "Permutations",
                "prompt": "In this chapter, why are arrangements like ROSE and REOS treated as different permutations?",
                "options": ["Because the order of letters is important", "Because repetition is allowed", "Because vowels are ignored", "Because only selection matters"],
                "correct": 0,
                "explanation": "A permutation is an arrangement, so changing the order creates a different permutation.",
            },
            {
                "topic": "Number Lock Problem",
                "prompt": "A 4-wheel number lock uses digits 0 to 9 without repetition. If the first digit is remembered as 7, how many 3-digit sequences may need checking for the remaining places?",
                "options": ["504", "729", "84", "720"],
                "correct": 0,
                "explanation": "After fixing 7, choose and arrange 3 digits from the remaining 9: 9 x 8 x 7 = 504.",
            },
        ]
        hard_bank = [
            {
                "topic": "Permutations Without Repetition",
                "prompt": "How many 5-digit telephone numbers can be made using digits 0 to 9 if every number starts with 67 and no digit is repeated?",
                "options": ["336", "504", "720", "3024"],
                "correct": 0,
                "explanation": "The first two digits are fixed as 67. The remaining 3 places use 8 remaining digits without repetition: 8 x 7 x 6 = 336.",
            },
            {
                "topic": "Restricted Arrangement",
                "prompt": "How many 3-digit even numbers can be formed from 1, 2, 3, 4, 5, 6 if repetition is allowed?",
                "options": ["108", "120", "90", "216"],
                "correct": 0,
                "explanation": "The units place has 3 choices: 2, 4, 6. The hundreds and tens places each have 6 choices. Total = 6 x 6 x 3 = 108.",
            },
            {
                "topic": "Multiplication Principle",
                "prompt": "A code has 4 letters chosen from the first 10 English letters, and no letter can repeat. How many different codes are possible?",
                "options": ["5040", "10000", "720", "40"],
                "correct": 0,
                "explanation": "There are 10 choices, then 9, then 8, then 7. Total = 10 x 9 x 8 x 7 = 5040.",
            },
            {
                "topic": "At Least Cases",
                "prompt": "Five different flags are available. A signal must use at least 2 flags and at most 4 flags, one below another. How many signals are possible?",
                "options": ["200", "320", "180", "260"],
                "correct": 0,
                "explanation": "Count 2-flag, 3-flag and 4-flag signals: 5P2 + 5P3 + 5P4 = 20 + 60 + 120 = 200.",
            },
            {
                "topic": "Number Lock Problem",
                "prompt": "A 4-wheel lock uses digits 0 to 9 without repetition. You remember only that the first digit is odd. How many full sequences may need checking?",
                "options": ["2520", "504", "3024", "3600"],
                "correct": 0,
                "explanation": "The first digit has 5 odd choices. Then the remaining places have 9, 8, and 7 choices. Total = 5 x 9 x 8 x 7 = 2520.",
            },
        ]
        competitive_bank = [
            {
                "topic": "Permutations With Restrictions",
                "prompt": "How many 6-digit numbers can be formed using digits 0, 1, 2, 3, 4, 5 without repetition if the number must be divisible by 5?",
                "options": ["216", "192", "240", "120"],
                "correct": 0,
                "explanation": "Last digit is 0 or 5. If last is 0: remaining 5 places use 5 digits, first cannot be 0 already used, so 5! = 120. If last is 5: first digit cannot be 0, so 4 choices, then 4P4 = 24 ways for remaining places, total 96. Grand total = 216.",
            },
            {
                "topic": "Combinations",
                "prompt": "From 7 boys and 5 girls, a committee of 5 is formed with at least 2 girls. How many committees are possible?",
                "options": ["596", "546", "462", "756"],
                "correct": 0,
                "explanation": "Cases: 2G3B + 3G2B + 4G1B + 5G0B = C(5,2)C(7,3)+C(5,3)C(7,2)+C(5,4)C(7,1)+C(5,5)=350+210+35+1=596.",
            },
            {
                "topic": "Circular Permutations",
                "prompt": "In how many ways can 6 different people sit around a circular table if two particular people must sit together?",
                "options": ["48", "120", "240", "24"],
                "correct": 0,
                "explanation": "Treat the two particular people as one block. Then 5 units sit circularly in (5-1)! ways, and the block has 2 internal arrangements. Total = 4! x 2 = 48.",
            },
            {
                "topic": "Arrangements With Identical Objects",
                "prompt": "How many distinct arrangements can be made from the letters of the word BANANA?",
                "options": ["60", "120", "720", "30"],
                "correct": 0,
                "explanation": "BANANA has 6 letters with A repeated 3 times and N repeated 2 times. Distinct arrangements = 6!/(3!2!) = 60.",
            },
            {
                "topic": "Selection Strategy",
                "prompt": "How many ways can 4 cards be selected from a standard deck so that all 4 are of different suits?",
                "options": ["28561", "270725", "2197", "52"],
                "correct": 0,
                "explanation": "Choose one card from each suit: 13 x 13 x 13 x 13 = 13^4 = 28561.",
            },
        ]
        bank = competitive_bank if difficulty == Difficulty.competitive else hard_bank if difficulty == Difficulty.hard else medium_bank

        selected: list[QuizQuestion] = []
        for offset in range(question_count):
            item = bank[(start_index + offset) % len(bank)]
            selected.append(
                QuizQuestion(
                    id=f"q-pc-{start_index + offset + 1}",
                    subject=subject,
                    topic=item["topic"],
                    difficulty=difficulty,
                    prompt=item["prompt"],
                    options=item["options"],
                    correct_option_index=item["correct"],
                    explanation=item["explanation"],
                )
            )
        return selected

    def _trigonometry_questions(
        self,
        subject: str,
        difficulty: Difficulty,
        question_count: int,
        start_index: int,
    ) -> list[QuizQuestion]:
        medium_bank = [
            {
                "topic": "Trigonometric Ratios",
                "prompt": "In a right-angled triangle, what does sin A represent for an acute angle A?",
                "options": ["Opposite side / Hypotenuse", "Adjacent side / Hypotenuse", "Opposite side / Adjacent side", "Hypotenuse / Opposite side"],
                "correct": 0,
                "explanation": "For an acute angle in a right triangle, sin A is defined as opposite side divided by hypotenuse.",
            },
            {
                "topic": "Trigonometric Ratios",
                "prompt": "Which ratio is equal to tan A?",
                "options": ["sin A / cos A", "cos A / sin A", "1 / sin A", "1 / cos A"],
                "correct": 0,
                "explanation": "tan A = opposite/adjacent, while sin A / cos A = (opposite/hypotenuse)/(adjacent/hypotenuse) = opposite/adjacent.",
            },
            {
                "topic": "Radian Measure",
                "prompt": "What is the radian measure of 180 degrees?",
                "options": ["pi radians", "2pi radians", "pi/2 radians", "1 radian"],
                "correct": 0,
                "explanation": "180 degrees equals pi radians.",
            },
            {
                "topic": "Degree-Radian Conversion",
                "prompt": "What is the degree measure of pi/2 radians?",
                "options": ["90 degrees", "180 degrees", "45 degrees", "60 degrees"],
                "correct": 0,
                "explanation": "Since pi radians is 180 degrees, pi/2 radians is 90 degrees.",
            },
            {
                "topic": "Unit Circle",
                "prompt": "On the unit circle, what does the x-coordinate of a point corresponding to angle theta represent?",
                "options": ["cos theta", "sin theta", "tan theta", "cot theta"],
                "correct": 0,
                "explanation": "On the unit circle, the point for angle theta has coordinates (cos theta, sin theta).",
            },
            {
                "topic": "Quadrants and Signs",
                "prompt": "In the second quadrant, which trigonometric ratio is positive?",
                "options": ["sin theta", "cos theta", "tan theta", "sec theta"],
                "correct": 0,
                "explanation": "In quadrant II, y is positive and x is negative, so sin theta is positive while cos and tan are negative.",
            },
            {
                "topic": "Basic Identities",
                "prompt": "Which identity is true for every angle where the expressions are defined?",
                "options": ["sin^2 theta + cos^2 theta = 1", "sin theta + cos theta = 1", "tan theta = sin theta + cos theta", "cos^2 theta - sin^2 theta = 1"],
                "correct": 0,
                "explanation": "The fundamental Pythagorean identity is sin^2 theta + cos^2 theta = 1.",
            },
            {
                "topic": "Trigonometric Functions",
                "prompt": "Why does the chapter extend trigonometry beyond acute angles in right triangles?",
                "options": ["To define trigonometric functions for general angles", "To avoid using radians", "To remove the need for coordinates", "To study only triangle areas"],
                "correct": 0,
                "explanation": "The chapter moves from acute-angle ratios to trigonometric functions that can be studied for general angles.",
            },
        ]
        hard_bank = [
            {
                "topic": "Degree-Radian Conversion",
                "prompt": "Convert 210 degrees into radian measure.",
                "options": ["7pi/6", "5pi/6", "4pi/3", "3pi/2"],
                "correct": 0,
                "explanation": "210 degrees x pi/180 = 7pi/6 radians.",
            },
            {
                "topic": "Quadrants and Signs",
                "prompt": "If sin theta < 0 and cos theta > 0, in which quadrant does theta lie?",
                "options": ["Quadrant IV", "Quadrant II", "Quadrant III", "Quadrant I"],
                "correct": 0,
                "explanation": "sin is negative below the x-axis and cos is positive to the right of the y-axis, so theta is in quadrant IV.",
            },
            {
                "topic": "Basic Identities",
                "prompt": "If cos theta = 3/5 and theta is acute, what is sin theta?",
                "options": ["4/5", "3/4", "5/4", "5/3"],
                "correct": 0,
                "explanation": "Using sin^2 theta + cos^2 theta = 1, sin theta = sqrt(1 - 9/25) = 4/5 for an acute angle.",
            },
            {
                "topic": "Trigonometric Ratios",
                "prompt": "If the terminal side of theta passes through (-3, 4), what is tan theta?",
                "options": ["-4/3", "4/3", "-3/4", "3/5"],
                "correct": 0,
                "explanation": "tan theta = y/x = 4/(-3) = -4/3.",
            },
            {
                "topic": "Radian Measure",
                "prompt": "An arc length equals 11 cm in a circle of radius 7 cm. What is the angle in radians?",
                "options": ["11/7", "7/11", "77", "18"],
                "correct": 0,
                "explanation": "In radians, theta = arc length / radius = 11/7.",
            },
            {
                "topic": "Unit Circle",
                "prompt": "On the unit circle, if theta = 5pi/6, which coordinate pair is correct?",
                "options": ["(-sqrt(3)/2, 1/2)", "(sqrt(3)/2, 1/2)", "(-1/2, sqrt(3)/2)", "(1/2, -sqrt(3)/2)"],
                "correct": 0,
                "explanation": "5pi/6 is in quadrant II with reference angle pi/6, so cos is -sqrt(3)/2 and sin is 1/2.",
            },
        ]
        competitive_bank = [
            {
                "topic": "Trig Equation",
                "prompt": "How many solutions does sin x = 1/2 have in the interval [0, 2pi]?",
                "options": ["2", "1", "3", "4"],
                "correct": 0,
                "explanation": "sin x = 1/2 at x = pi/6 and 5pi/6 in [0, 2pi], so there are 2 solutions.",
            },
            {
                "topic": "Identity Application",
                "prompt": "If tan theta + cot theta = 4, what is tan^2 theta + cot^2 theta?",
                "options": ["14", "16", "12", "8"],
                "correct": 0,
                "explanation": "(tan theta + cot theta)^2 = tan^2 theta + cot^2 theta + 2tan theta cot theta. Since tan theta cot theta = 1, 16 = required + 2, so required = 14.",
            },
            {
                "topic": "Quadrant Reasoning",
                "prompt": "If sec theta < 0 and cosec theta > 0, which quadrant contains theta?",
                "options": ["Quadrant II", "Quadrant III", "Quadrant IV", "Quadrant I"],
                "correct": 0,
                "explanation": "sec theta < 0 means cos theta < 0. cosec theta > 0 means sin theta > 0. That happens in quadrant II.",
            },
            {
                "topic": "Compound Identity",
                "prompt": "If sin theta + cos theta = sqrt(2), what is sin theta cos theta?",
                "options": ["1/2", "0", "1", "-1/2"],
                "correct": 0,
                "explanation": "Square both sides: sin^2 theta + cos^2 theta + 2sin theta cos theta = 2. So 1 + 2sin theta cos theta = 2, hence sin theta cos theta = 1/2.",
            },
            {
                "topic": "Radians and Arc Length",
                "prompt": "A wheel of radius 14 cm rotates through 150 degrees. What distance does a point on its rim travel?",
                "options": ["35pi/3 cm", "70pi/3 cm", "21pi cm", "14pi/3 cm"],
                "correct": 0,
                "explanation": "Arc length = r theta, with theta = 150 x pi/180 = 5pi/6. So distance = 14 x 5pi/6 = 35pi/3 cm.",
            },
        ]
        bank = competitive_bank if difficulty == Difficulty.competitive else hard_bank if difficulty == Difficulty.hard else medium_bank

        selected: list[QuizQuestion] = []
        for offset in range(question_count):
            item = bank[(start_index + offset) % len(bank)]
            selected.append(
                QuizQuestion(
                    id=f"q-trig-{start_index + offset + 1}",
                    subject=subject,
                    topic=item["topic"],
                    difficulty=difficulty,
                    prompt=item["prompt"],
                    options=item["options"],
                    correct_option_index=item["correct"],
                    explanation=item["explanation"],
                )
            )
        return selected

    def _generic_chapter_questions(
        self,
        subject: str,
        difficulty: Difficulty,
        question_count: int,
        topics: list[str],
        start_index: int,
    ) -> list[QuizQuestion]:
        usable_topics = [topic for topic in topics if len(topic) > 3] or ["Main concept", "Important definition", "Solved example"]
        selected: list[QuizQuestion] = []
        for offset in range(question_count):
            topic = usable_topics[(start_index + offset) % len(usable_topics)]
            selected.append(
                QuizQuestion(
                    id=f"q-chapter-{start_index + offset + 1}",
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    prompt=(
                        f"A competitive exam asks a multi-step application from {topic} in {subject}. "
                        "Which approach is most appropriate?"
                        if difficulty == Difficulty.competitive
                        else f"Which question would best test understanding of {topic} in the chapter {subject}?"
                    ),
                    options=[
                        f"Apply {topic} to solve a new example from the chapter",
                        f"Copy one sentence containing {topic} without using it",
                        f"Ignore {topic} and answer from a different chapter",
                        f"Memorize only the page number where {topic} appears",
                    ],
                    correct_option_index=0,
                    explanation=f"A useful quiz question should test whether the student can apply {topic}, not merely recognize a sentence.",
                )
            )
        return selected

    def _content_sentences(self, source_text: str) -> list[str]:
        compact = re.sub(r"\s+", " ", source_text)
        sentences = re.split(r"(?<=[.!?])\s+", compact)
        return [
            sentence.strip()
            for sentence in sentences
            if 70 <= len(sentence.strip()) <= 260
            and not sentence.strip().lower().startswith(("reprint", "chapter"))
        ]

    def _key_phrase(self, sentence: str) -> str:
        cleaned = sentence.strip()
        if len(cleaned) <= 95:
            return cleaned
        return cleaned[:92].rstrip() + "..."

    def _chapter_profile(self, source_text: str, fallback_subject: str) -> dict[str, object]:
        text = source_text.lower()
        upper_text = source_text.upper()
        if "PERMUTATIONS AND COMBINATIONS" in upper_text:
            return {
                "subject": "Permutations and Combinations",
                "topics": [
                    "Fundamental Principle of Counting",
                    "Permutations",
                    "Arrangements Without Repetition",
                    "Arrangements With Repetition",
                    "Combinations",
                    "Factorial Notation",
                ],
            }
        if "TRIGONOMETRIC FUNCTIONS" in upper_text or "TRIGONOMETRIC RATIOS" in upper_text or "radian" in text:
            return {
                "subject": "Trigonometric Functions",
                "topics": [
                    "Trigonometric Ratios",
                    "Radian Measure",
                    "Degree-Radian Conversion",
                    "Unit Circle",
                    "Quadrants and Signs",
                    "Basic Identities",
                ],
            }
        return {"subject": fallback_subject or "Uploaded PDF", "topics": self._topics_from_text(source_text)}

    def _competitive_internet_context(self, subject: str, topics: list[str]) -> list[str]:
        queries = [
            f"{subject} {topic} JEE Main previous year question"
            for topic in topics[:3]
        ]
        snippets: list[str] = []
        for query in queries:
            try:
                response = httpx.get(
                    "https://html.duckduckgo.com/html/",
                    params={"q": query},
                    headers={"User-Agent": "StudyMind/0.1"},
                    timeout=6,
                )
                response.raise_for_status()
                text = re.sub(r"<[^>]+>", " ", response.text)
                text = re.sub(r"\s+", " ", text)
                if len(text) > 180:
                    snippets.append(f"Search query: {query}. Snippet: {text[:900]}")
            except Exception:
                snippets.append(
                    f"Search query unavailable at runtime: {query}. Generate a fresh competitive-style question for this topic."
                )
        return snippets

    def _randomize_questions(self, questions: list[QuizQuestion]) -> list[QuizQuestion]:
        randomized: list[QuizQuestion] = []
        for question in questions:
            indexed_options = list(enumerate(question.options))
            random.shuffle(indexed_options)
            randomized.append(
                question.model_copy(
                    update={
                        "options": [option for _, option in indexed_options],
                        "correct_option_index": next(
                            new_index
                            for new_index, (old_index, _) in enumerate(indexed_options)
                            if old_index == question.correct_option_index
                        ),
                    }
                )
            )
        return randomized

    def _topics_from_text(self, source_text: str) -> list[str]:
        words = re.findall(r"[A-Za-z][A-Za-z\-]{4,}", source_text.lower())
        stop_words = {
            "about", "after", "also", "between", "chapter", "could", "every", "following",
            "from", "have", "important", "including", "into", "learning", "material",
            "module", "notes", "other", "question", "should", "student", "study",
            "their", "there", "these", "this", "through", "using", "where", "which", "with",
        }
        counts: dict[str, int] = {}
        for word in words:
            if word in stop_words:
                continue
            counts[word] = counts.get(word, 0) + 1
        topics = [word.title() for word, _ in sorted(counts.items(), key=lambda item: item[1], reverse=True)[:6]]
        return topics or ["uploaded material", "key concepts", "revision"]

    def _strip_json_fence(self, text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?", "", text).strip()
            text = re.sub(r"```$", "", text).strip()
        return text

    def _gemini_history(self, history: list[ChatMessage]) -> list[dict[str, object]]:
        contents: list[dict[str, object]] = []
        for item in history[-8:]:
            role = "model" if item.role in {"assistant", "ai", "model"} else "user"
            contents.append({"role": role, "parts": [{"text": item.content}]})
        return contents


ai_provider = AIProvider()
