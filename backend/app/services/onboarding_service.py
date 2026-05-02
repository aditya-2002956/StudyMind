from datetime import datetime, timezone

from app.db.repository import save_onboarding
from app.schemas.study import (
    LearningPace,
    OnboardingResult,
    OnboardingSurveyCreate,
    StudentProfile,
    StudyDomain,
    StudyMaterialSource,
    SubjectSelection,
)


DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "VTU B.E. CSE Core": [
        "vtu",
        "be",
        "b.e",
        "cse",
        "computer science",
        "data structures",
        "operating systems",
        "dbms",
        "computer networks",
        "algorithms",
        "software engineering",
    ],
    "VTU Programming and Labs": [
        "programming",
        "python",
        "c programming",
        "java",
        "c++",
        "web",
        "react",
        "lab",
        "project",
        "mini project",
    ],
    "VTU AI, ML and Data": [
        "machine learning",
        "ml",
        "ai",
        "artificial intelligence",
        "data science",
        "data analytics",
        "computer vision",
        "deep learning",
        "nlp",
        "big data",
    ],
    "VTU Systems, Cloud and Security": [
        "cloud",
        "cyber",
        "security",
        "cryptography",
        "network security",
        "iot",
        "compiler",
        "distributed",
        "parallel",
        "devops",
    ],
    "Indian Competitive and Placement Prep": [
        "gate",
        "placements",
        "aptitude",
        "dsa",
        "interview",
        "coding round",
        "competitive",
    ],
    "Indian Engineering Foundations": [
        "math",
        "mathematics",
        "physics",
        "chemistry",
        "engineering drawing",
        "constitution",
        "kannada",
        "english",
    ],
    "Study Skills and Retention": ["revision", "retention", "focus", "notes", "time", "memory", "plan"],
}

VTU_CSE_SOURCES = [
    StudyMaterialSource(
        title="VTU B.E Scheme & Syllabus page",
        url="https://vtu.ac.in/b-e-scheme-syllabus/",
        notes="Official VTU index for B.E. schemes and syllabus PDFs.",
    ),
    StudyMaterialSource(
        title="VTU 2022 CSE 3rd-8th Semester Scheme",
        url="https://vtu.ac.in/pdf/2022_3to8/38csesch.pdf",
        notes="Includes CSE semester scheme, core courses, electives, labs, project phases, and credits.",
    ),
    StudyMaterialSource(
        title="VTU 2022 CSE 3rd-4th Semester Syllabus",
        url="https://vtu.ac.in/pdf/2022_3to8/2csessyll.pdf",
        notes="Detailed syllabus starter for early CSE professional core subjects.",
    ),
    StudyMaterialSource(
        title="VTU 2022 CSE 5th Semester Syllabus",
        url="https://vtu.ac.in/pdf/2022_3to8/3csesyll.pdf",
        notes="Detailed syllabus starter for 5th semester CSE subjects.",
    ),
    StudyMaterialSource(
        title="VTU 2022 CSE 6th Semester Syllabus",
        url="https://vtu.ac.in/pdf/2022_3to8/6csesyll.pdf",
        notes="Detailed syllabus starter for 6th semester CSE subjects.",
    ),
]

VTU_CSE_SEMESTER_SUBJECTS = {
    "3": [
        "Mathematics for Computer Science",
        "Digital Design and Computer Organization",
        "Operating Systems",
        "Data Structures and Applications",
        "Data Structures Lab",
    ],
    "4": [
        "Analysis and Design of Algorithms",
        "Microcontrollers",
        "Database Management Systems",
        "Analysis and Design of Algorithms Lab",
        "Discrete Mathematical Structures",
        "Graph Theory",
        "Linear Algebra",
    ],
    "5": [
        "Software Engineering and Project Management",
        "Computer Networks",
        "Theory of Computation",
        "Web Technology Lab",
        "Mini Project",
        "Research Methodology and IPR",
    ],
    "6": [
        "Cloud Computing",
        "Machine Learning",
        "Machine Learning Lab",
        "Blockchain Technology",
        "Compiler Design",
        "Computer Vision",
        "Advanced Java",
        "React",
        "DevOps",
        "Generative AI",
    ],
    "7": [
        "Internet of Things",
        "Parallel Computing",
        "Cryptography and Network Security",
        "Deep Learning",
        "Natural Language Processing",
        "Big Data Analytics",
        "Major Project Phase-II",
    ],
}


def process_onboarding(payload: OnboardingSurveyCreate) -> OnboardingResult:
    text = " ".join(
        payload.current_subjects
        + payload.goals
        + payload.weak_areas
        + payload.strong_areas
        + payload.material_sources
        + [payload.target_exam or "", payload.preferred_learning_style]
    ).lower()

    recommended_domains = _infer_domains(text, payload.current_subjects)
    suggested_subjects = _suggest_subjects(payload.current_subjects, recommended_domains)
    suggested_subjects = _apply_vtu_cse_subjects(text, suggested_subjects)
    profile = _build_profile(payload, suggested_subjects)
    notebook_needs = _notebook_needs(payload, suggested_subjects)
    material_needs = _material_needs(payload, recommended_domains)
    starter_sources = _starter_sources(text, recommended_domains)

    result = OnboardingResult(
        user_id=payload.user_id,
        profile=profile,
        recommended_domains=recommended_domains,
        suggested_next_subjects=suggested_subjects,
        notebook_needs=notebook_needs,
        study_material_needs=material_needs,
        starter_material_sources=starter_sources,
        next_step="Take a short diagnostic quiz so StudyMind can validate these recommendations with performance data.",
        created_at=datetime.now(timezone.utc),
    )
    save_onboarding(result)
    return result


def _infer_domains(text: str, subjects: list[str]) -> list[StudyDomain]:
    domains: list[StudyDomain] = []
    subject_text = ", ".join(subjects) if subjects else "your selected subjects"
    for domain, keywords in DOMAIN_KEYWORDS.items():
        hits = [keyword for keyword in keywords if keyword in text]
        if not hits:
            continue
        confidence = min(0.95, 0.45 + len(hits) * 0.12)
        domains.append(
            StudyDomain(
                name=domain,
                confidence=round(confidence, 2),
                reason=f"Matched your goals or subjects with: {', '.join(hits[:4])}.",
                suggested_subjects=subjects or [subject_text],
                source="VTU B.E. CSE syllabus starter" if domain.startswith("VTU") else "Survey inference",
            )
        )

    if not domains:
        domains.append(
            StudyDomain(
                name="Study Skills and Retention",
                confidence=0.55,
                reason="Not enough domain-specific signals yet, so StudyMind will start with study habits and diagnostics.",
                suggested_subjects=subjects or ["General Aptitude"],
                source="Survey inference",
            )
        )

    return sorted(domains, key=lambda item: item.confidence, reverse=True)[:4]


def _suggest_subjects(subjects: list[str], domains: list[StudyDomain]) -> list[str]:
    suggestions = list(dict.fromkeys(subject.strip() for subject in subjects if subject.strip()))
    if suggestions:
        return suggestions[:6]

    fallback_by_domain = {
        "VTU B.E. CSE Core": ["Data Structures", "Operating Systems", "DBMS", "Computer Networks"],
        "VTU Programming and Labs": ["Python Programming", "Java", "Web Technology Lab", "Mini Project"],
        "VTU AI, ML and Data": ["Machine Learning", "Artificial Intelligence", "Data Analytics", "Computer Vision"],
        "VTU Systems, Cloud and Security": ["Cloud Computing", "Cyber Security", "Compiler Design", "DevOps"],
        "Indian Competitive and Placement Prep": ["DSA", "Aptitude", "Coding Interview", "GATE CS"],
        "Indian Engineering Foundations": ["Engineering Mathematics", "Physics", "Chemistry", "Indian Constitution"],
        "Study Skills and Retention": ["Study Planning", "Revision", "Practice"],
    }
    for domain in domains:
        suggestions.extend(fallback_by_domain.get(domain.name, []))
    return list(dict.fromkeys(suggestions))[:6]


def _build_profile(payload: OnboardingSurveyCreate, subjects: list[str]) -> StudentProfile:
    selections = [
        SubjectSelection(
            subject=subject,
            goal=payload.target_exam or ", ".join(payload.goals[:2]) or "Improve learning outcomes",
            weekly_hours=max(1, payload.weekly_hours // max(1, len(subjects))),
        )
        for subject in subjects
    ]
    return StudentProfile(
        user_id=payload.user_id,
        name=payload.name,
        grade_level=payload.grade_level,
        learning_pace=LearningPace.normal,
        subjects=selections,
        created_at=datetime.now(timezone.utc),
    )


def _notebook_needs(payload: OnboardingSurveyCreate, subjects: list[str]) -> list[str]:
    if not payload.wants_notebooks:
        return []
    return [f"{subject} mistake notebook" for subject in subjects[:4]] + ["Weekly revision notebook"]


def _material_needs(payload: OnboardingSurveyCreate, domains: list[StudyDomain]) -> list[str]:
    if not payload.wants_study_materials:
        return []

    needs = ["Diagnostic quiz set", "Topic-wise revision notes", "Practice questions with explanations"]
    if any(domain.name.startswith("VTU") for domain in domains):
        needs.append("VTU module-wise syllabus tracker")
        needs.append("VTU previous-year question paper map")
    if any(domain.name == "Indian Competitive and Placement Prep" for domain in domains):
        needs.append("GATE/placement topic bridge")
        needs.append("Code practice notebook and DSA drills")
    return needs


def _apply_vtu_cse_subjects(text: str, subjects: list[str]) -> list[str]:
    if not _is_vtu_cse_context(text):
        return subjects

    selected = list(subjects)
    semester = _detect_semester(text)
    if semester and semester in VTU_CSE_SEMESTER_SUBJECTS:
        selected.extend(VTU_CSE_SEMESTER_SUBJECTS[semester])
    else:
        selected.extend(
            [
                "Data Structures and Applications",
                "Operating Systems",
                "Database Management Systems",
                "Analysis and Design of Algorithms",
                "Computer Networks",
                "Machine Learning",
            ]
        )
    return list(dict.fromkeys(selected))[:8]


def _starter_sources(text: str, domains: list[StudyDomain]) -> list[StudyMaterialSource]:
    if _is_vtu_cse_context(text) or any(domain.name.startswith("VTU") for domain in domains):
        return VTU_CSE_SOURCES
    return []


def _is_vtu_cse_context(text: str) -> bool:
    return any(marker in text for marker in ["vtu", "cse", "computer science", "b.e", "be cse"])


def _detect_semester(text: str) -> str | None:
    semester_map = {
        "third": "3",
        "3rd": "3",
        "sem 3": "3",
        "semester 3": "3",
        "fourth": "4",
        "4th": "4",
        "sem 4": "4",
        "semester 4": "4",
        "fifth": "5",
        "5th": "5",
        "sem 5": "5",
        "semester 5": "5",
        "sixth": "6",
        "6th": "6",
        "sem 6": "6",
        "semester 6": "6",
        "seventh": "7",
        "7th": "7",
        "sem 7": "7",
        "semester 7": "7",
    }
    for phrase, semester in semester_map.items():
        if phrase in text:
            return semester
    return None
