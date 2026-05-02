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
    "CBSE Foundational Middle School": [
        "class 5",
        "class 6",
        "class 7",
        "class 8",
        "grade 5",
        "grade 6",
        "grade 7",
        "grade 8",
        "middle school",
        "evs",
    ],
    "CBSE Secondary Board Prep": [
        "class 9",
        "class 10",
        "grade 9",
        "grade 10",
        "secondary",
        "standard mathematics",
        "basic mathematics",
    ],
    "CBSE Senior Secondary Science": [
        "class 11",
        "class 12",
        "grade 11",
        "grade 12",
        "pcm",
        "pcb",
        "physics",
        "chemistry",
        "biology",
        "mathematics",
        "computer science",
    ],
    "CBSE Senior Secondary Commerce": [
        "class 11",
        "class 12",
        "commerce",
        "accountancy",
        "business studies",
        "economics",
        "entrepreneurship",
        "applied mathematics",
    ],
    "CBSE Senior Secondary Humanities": [
        "class 11",
        "class 12",
        "humanities",
        "arts",
        "history",
        "geography",
        "political science",
        "psychology",
        "sociology",
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

CBSE_SOURCES = [
    StudyMaterialSource(
        title="CBSE Curriculum 2025-26",
        url="https://cbseacademic.nic.in/curriculum_2026.html",
        source_type="official_curriculum",
        provider="CBSE Academic",
        notes="Official CBSE Academic curriculum page for 2025-26, including secondary and senior secondary curriculum.",
        relevance=0.95,
    ),
    StudyMaterialSource(
        title="CBSE Curriculum 2026-27",
        url="https://cbseacademic.nic.in/curriculum_2027.html",
        source_type="official_curriculum",
        provider="CBSE Academic",
        notes="Official CBSE Academic curriculum page for 2026-27 and onward curriculum documents.",
        relevance=0.95,
    ),
    StudyMaterialSource(
        title="CBSE Circular: Competency-Based Textbooks for Grades 4, 5, 7 and 8",
        url="https://www.cbseacademic.nic.in/web_material/Circulars/2025/12_Circular_2025.pdf",
        source_type="official_circular",
        provider="CBSE Academic",
        notes="Official circular referencing NCERT competency-based textbooks and bridge programmes for Classes 5 and 8.",
        relevance=0.85,
    ),
    StudyMaterialSource(
        title="CBSE Circular: New Textbooks for Grades 5 and 8",
        url="https://www.cbseacademic.nic.in/web_material/Circulars/2025/48_Circular_2025.pdf",
        source_type="official_circular",
        provider="CBSE Academic",
        notes="Official CBSE circular listing NCERT textbook links for Class 5 and Class 8 subjects.",
        relevance=0.85,
    ),
    StudyMaterialSource(
        title="NCERT Textbooks Portal",
        url="https://ncert.nic.in/textbook.php",
        source_type="official_textbooks",
        provider="NCERT",
        notes="Official NCERT textbook portal for CBSE-aligned textbooks from Class 1 to 12.",
        relevance=0.9,
    ),
]

CBSE_CLASS_SUBJECTS = {
    "5": ["English", "Hindi", "Mathematics", "Environmental Studies", "Arts", "Physical Education and Well Being"],
    "6": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer/AI Foundations"],
    "7": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer/AI Foundations"],
    "8": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer/AI Foundations"],
    "9": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer Applications"],
    "10": ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer Applications"],
    "11_science": ["English Core", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
    "12_science": ["English Core", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
    "11_commerce": ["English Core", "Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Entrepreneurship"],
    "12_commerce": ["English Core", "Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Entrepreneurship"],
    "11_humanities": ["English Core", "History", "Geography", "Political Science", "Psychology", "Sociology"],
    "12_humanities": ["English Core", "History", "Geography", "Political Science", "Psychology", "Sociology"],
}

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
    suggested_subjects = _apply_cbse_subjects(text, suggested_subjects)
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
        if _skip_domain_for_context(domain, text):
            continue
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
                source=_domain_source(domain),
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


def _skip_domain_for_context(domain: str, text: str) -> bool:
    if domain == "CBSE Senior Secondary Commerce":
        return not any(marker in text for marker in ["commerce", "accountancy", "business studies", "economics", "entrepreneurship"])
    if domain == "CBSE Senior Secondary Humanities":
        return not any(marker in text for marker in ["humanities", "arts", "history", "geography", "political science", "psychology", "sociology"])
    if domain == "CBSE Senior Secondary Science":
        return any(marker in text for marker in ["commerce", "humanities", "arts"]) and not any(
            marker in text for marker in ["physics", "chemistry", "biology", "mathematics", "computer science", "science", "pcm", "pcb"]
        )
    return False


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
        "CBSE Foundational Middle School": ["English", "Hindi", "Mathematics", "Science", "Social Science"],
        "CBSE Secondary Board Prep": ["Mathematics", "Science", "Social Science", "English", "Computer Applications"],
        "CBSE Senior Secondary Science": ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"],
        "CBSE Senior Secondary Commerce": ["Accountancy", "Business Studies", "Economics", "Applied Mathematics"],
        "CBSE Senior Secondary Humanities": ["History", "Political Science", "Geography", "Psychology"],
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
    if any(domain.name.startswith("CBSE") for domain in domains):
        needs.append("CBSE/NCERT chapter-wise syllabus tracker")
        needs.append("Board-style question practice map")
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
    sources: list[StudyMaterialSource] = []
    if _is_vtu_cse_context(text) or any(domain.name.startswith("VTU") for domain in domains):
        sources.extend(VTU_CSE_SOURCES)
    if _is_cbse_context(text) or any(domain.name.startswith("CBSE") for domain in domains):
        sources.extend(CBSE_SOURCES)
    return sources


def _is_vtu_cse_context(text: str) -> bool:
    return any(marker in text for marker in ["vtu", "cse", "computer science", "b.e", "be cse"])


def _is_cbse_context(text: str) -> bool:
    return any(marker in text for marker in ["cbse", "ncert", "class ", "grade ", "board exam", "boards"])


def _apply_cbse_subjects(text: str, subjects: list[str]) -> list[str]:
    if not _is_cbse_context(text):
        return subjects

    selected = list(subjects)
    class_level = _detect_class_level(text)
    stream = _detect_cbse_stream(text)

    if class_level in {"11", "12"}:
        selected.extend(CBSE_CLASS_SUBJECTS.get(f"{class_level}_{stream}", CBSE_CLASS_SUBJECTS[f"{class_level}_science"]))
    elif class_level and class_level in CBSE_CLASS_SUBJECTS:
        selected.extend(CBSE_CLASS_SUBJECTS[class_level])
    else:
        selected.extend(["English", "Hindi", "Mathematics", "Science", "Social Science"])

    return list(dict.fromkeys(selected))[:8]


def _detect_class_level(text: str) -> str | None:
    class_map = {
        "class 5": "5", "grade 5": "5", "5th": "5",
        "class 6": "6", "grade 6": "6", "6th": "6",
        "class 7": "7", "grade 7": "7", "7th": "7",
        "class 8": "8", "grade 8": "8", "8th": "8",
        "class 9": "9", "grade 9": "9", "9th": "9",
        "class 10": "10", "grade 10": "10", "10th": "10",
        "class 11": "11", "grade 11": "11", "11th": "11",
        "class 12": "12", "grade 12": "12", "12th": "12",
    }
    for phrase, class_level in class_map.items():
        if phrase in text:
            return class_level
    return None


def _detect_cbse_stream(text: str) -> str:
    if any(marker in text for marker in ["commerce", "accountancy", "business studies", "economics"]):
        return "commerce"
    if any(marker in text for marker in ["humanities", "arts", "history", "political science", "psychology", "sociology"]):
        return "humanities"
    return "science"


def _domain_source(domain: str) -> str:
    if domain.startswith("VTU"):
        return "VTU B.E. CSE syllabus starter"
    if domain.startswith("CBSE"):
        return "CBSE/NCERT syllabus starter"
    return "Survey inference"


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
