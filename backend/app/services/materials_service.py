from urllib.parse import quote_plus

from app.schemas.study import MaterialSearchRequest, MaterialSearchResponse, StudyMaterialSource
from app.services.onboarding_service import CBSE_SOURCES, VTU_CSE_SOURCES


VTUCIRCLE_SOURCES = [
    StudyMaterialSource(
        title="VTUCircle VTU notes, model papers, syllabus and updates",
        url="https://vtucircle.com/",
        source_type="community_notes",
        provider="VTUCircle",
        notes="Popular VTU study-material hub for branch-wise notes, model papers, question banks, lab programs and syllabus updates.",
        relevance=0.86,
    ),
    StudyMaterialSource(
        title="VTUCircle CSE/ISE 2022 Scheme",
        url="https://vtucircle.com/2022-scheme-cse-ise/",
        source_type="community_notes",
        provider="VTUCircle",
        notes="CSE/ISE semester index for 2022 scheme notes, model papers and previous-year question papers.",
        relevance=0.9,
    ),
    StudyMaterialSource(
        title="VTUCircle CSE/ISE 6th Semester 2022 Scheme",
        url="https://vtucircle.com/6th-semester-2022-scheme-cse-ise/",
        source_type="community_notes",
        provider="VTUCircle",
        notes="Semester page with Cloud Computing, Machine Learning, Blockchain, Compiler Design, React, DevOps, Generative AI and lab resources.",
        relevance=0.9,
    ),
    StudyMaterialSource(
        title="VTUCircle AIML/DS 2022 Scheme",
        url="https://vtucircle.com/2022-scheme-aiml-ds/",
        source_type="community_notes",
        provider="VTUCircle",
        notes="AI/ML and Data Science semester index for VTU 2022 scheme resources.",
        relevance=0.88,
    ),
]

CBSE_BOOK_SOURCES = [
    StudyMaterialSource(
        title="NCERT Textbooks PDF portal for Classes I-XII",
        url="https://ncert.nic.in/textbook.php",
        source_type="official_textbooks",
        provider="NCERT",
        notes="Official NCERT PDF textbook portal. Use it for CBSE-aligned book PDFs from Class 5 to Class 12.",
        relevance=0.96,
    ),
    StudyMaterialSource(
        title="CBSE Academic curriculum and syllabus 2025-26",
        url="https://cbseacademic.nic.in/curriculum_2026.html",
        source_type="official_curriculum",
        provider="CBSE Academic",
        notes="Official curriculum page with secondary and senior-secondary syllabus documents and reading material.",
        relevance=0.95,
    ),
]


def search_materials(payload: MaterialSearchRequest) -> MaterialSearchResponse:
    context = " ".join(
        filter(None, [payload.education_system, payload.class_level, payload.stream, payload.subject, payload.topic])
    ).lower()

    results: list[StudyMaterialSource] = []
    if _is_vtu_context(context):
        results.extend(_ranked_sources(VTU_CSE_SOURCES, payload, boost=0.95))
        results.extend(_ranked_sources(_vtu_circle_sources_for(payload), payload, boost=0.9))
    if _is_cbse_context(context):
        results.extend(_ranked_sources(CBSE_BOOK_SOURCES + CBSE_SOURCES, payload, boost=0.95))

    if not results:
        results.extend(_ranked_sources(CBSE_BOOK_SOURCES + CBSE_SOURCES + VTU_CSE_SOURCES + VTUCIRCLE_SOURCES, payload, boost=0.65))

    queries = _build_search_queries(payload)
    results.extend(_search_link_cards(queries))

    return MaterialSearchResponse(
        education_system=payload.education_system,
        class_level=payload.class_level,
        stream=payload.stream,
        subject=payload.subject,
        topic=payload.topic,
        results=results[: payload.limit],
        search_queries=queries,
        note=(
            "StudyMind returns official starter links and safe search queries. "
            "For full internet crawling later, add a search API such as Tavily/SerpAPI and store fetched PDFs/notes after source checks."
        ),
    )


def _ranked_sources(
    sources: list[StudyMaterialSource],
    payload: MaterialSearchRequest,
    *,
    boost: float,
) -> list[StudyMaterialSource]:
    keyword_text = " ".join(filter(None, [payload.subject, payload.topic, payload.class_level, payload.stream])).lower()
    ranked: list[StudyMaterialSource] = []
    for source in sources:
        source_text = f"{source.title} {source.notes or ''}".lower()
        relevance = boost
        if payload.subject and payload.subject.lower() in source_text:
            relevance += 0.03
        if payload.topic and payload.topic.lower() in source_text:
            relevance += 0.03
        if keyword_text and any(token in source_text for token in keyword_text.split()):
            relevance += 0.02
        ranked.append(source.model_copy(update={"relevance": min(1, round(relevance, 2))}))
    return sorted(ranked, key=lambda item: item.relevance, reverse=True)


def _build_search_queries(payload: MaterialSearchRequest) -> list[str]:
    subject = payload.subject or "syllabus"
    topic = payload.topic or ""
    level = payload.class_level or ""
    stream = payload.stream or ""
    system = payload.education_system

    if _is_vtu_context(f"{system} {level} {stream}"):
        return [
            f"site:vtu.ac.in {system} {level} {stream} {subject} {topic} syllabus PDF".strip(),
            f"site:vtucircle.com {level} {stream} {subject} {topic} notes model papers previous year papers".strip(),
            f"site:vtu.ac.in {subject} {topic} VTU syllabus".strip(),
            f"site:vtu.ac.in VTU previous year question paper {subject}".strip(),
        ]

    if _is_cbse_context(f"{system} {level} {stream}"):
        return [
            f"site:cbseacademic.nic.in CBSE {level} {stream} {subject} {topic} curriculum".strip(),
            f"site:ncert.nic.in {level} {subject} {topic} textbook".strip(),
            f"site:ncert.nic.in textbook PDF {level} {subject}".strip(),
            f"site:cbseacademic.nic.in CBSE {level} {subject} sample paper".strip(),
        ]

    return [
        f"{system} {level} {stream} {subject} {topic} official syllabus".strip(),
        f"{subject} {topic} official study material".strip(),
    ]


def _search_link_cards(queries: list[str]) -> list[StudyMaterialSource]:
    cards: list[StudyMaterialSource] = []
    for query in queries:
        cards.append(
            StudyMaterialSource(
                title=f"Internet search: {query}",
                url=f"https://www.google.com/search?q={quote_plus(query)}",
                source_type="internet_search_query",
                provider="Google Search",
                notes="Use this to pull recent official PDFs, syllabus pages, sample papers, or notes. Prefer official/known sources before random blogs.",
                relevance=0.7,
            )
        )
    return cards


def _vtu_circle_sources_for(payload: MaterialSearchRequest) -> list[StudyMaterialSource]:
    text = " ".join(filter(None, [payload.class_level, payload.stream, payload.subject, payload.topic])).lower()
    sources = list(VTUCIRCLE_SOURCES)

    if "semester 3" in text or "sem 3" in text or "3rd" in text:
        sources.append(
            StudyMaterialSource(
                title="VTUCircle CSE/ISE 3rd Semester 2022 Scheme",
                url="https://vtucircle.com/3rd-semester-2022-scheme-cse-ise/",
                source_type="community_notes",
                provider="VTUCircle",
                notes="Branch and semester-specific VTU notes and model-paper page.",
                relevance=0.9,
            )
        )
    if "semester 4" in text or "sem 4" in text or "4th" in text:
        sources.append(
            StudyMaterialSource(
                title="VTUCircle CSE/ISE 4th Semester 2022 Scheme",
                url="https://vtucircle.com/4th-semester-2022-scheme-cse-ise/",
                source_type="community_notes",
                provider="VTUCircle",
                notes="Includes ADA, DBMS, DMS, graph theory and lab material entries.",
                relevance=0.9,
            )
        )
    if "semester 5" in text or "sem 5" in text or "5th" in text:
        sources.append(
            StudyMaterialSource(
                title="VTUCircle CSE/ISE 5th Semester 2022 Scheme",
                url="https://vtucircle.com/5th-semester-2022-scheme-cse-ise/",
                source_type="community_notes",
                provider="VTUCircle",
                notes="Includes Software Engineering, Computer Networks, TOC, Web Lab and elective material entries.",
                relevance=0.9,
            )
        )
    return sources


def _is_vtu_context(text: str) -> bool:
    text = text.lower()
    return any(
        marker in text
        for marker in [
            "vtu",
            "b.e",
            "b.tech",
            "be ",
            "m.tech",
            "cse",
            "semester",
            "engineering",
            "degree",
            "diploma",
        ]
    )


def _is_cbse_context(text: str) -> bool:
    text = text.lower()
    return any(marker in text for marker in ["cbse", "ncert", "class", "grade", "board"])
