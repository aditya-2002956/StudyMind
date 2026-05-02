# StudyMind Backend

FastAPI backend for StudyMind, an AI-powered personalized study assistant built for a vibe-coding hackathon.

## What It Does

- Creates student profiles and subject goals
- Generates quizzes for selected topics
- Scores attempts and detects weak topics
- Builds personalized study plans
- Schedules spaced-repetition revision cards
- Provides a tutor chat endpoint with local fallback responses
- Exposes a progress dashboard

The backend works without AI keys for demos. Add an OpenAI or Gemini key later and replace the `AIProvider` implementation in `app/services/ai_provider.py`.

## Quick Start

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open:

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`
- Supabase health: `http://127.0.0.1:8000/health/supabase`

## Example Flow

1. `POST /api/v1/users/profile`
2. `POST /api/v1/onboarding/survey`
3. `POST /api/v1/quizzes/generate`
4. `POST /api/v1/attempts`
5. `GET /api/v1/analysis/{user_id}`
6. `POST /api/v1/planner/generate`
7. `POST /api/v1/chat`
8. `GET /api/v1/dashboard/{user_id}`

## Auth Setup

The backend supports two modes:

- Demo mode: keep sending `user_id`, such as `demo-user`, in request bodies.
- Login mode: sign in with Supabase Auth on the frontend, then send the Supabase access token to the backend.

The demo mode is intentionally still supported for hackathon presentations.

### Frontend Auth Flow

After Supabase login, the frontend receives a session:

```js
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;
```

Send that token to the backend:

```js
fetch("http://127.0.0.1:8000/api/v1/auth/me", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

If the token is valid, the backend returns:

```json
{
  "id": "supabase-user-id",
  "email": "student@example.com",
  "role": "authenticated",
  "is_demo": false
}
```

When a logged-in request includes `Authorization: Bearer <token>`, the backend uses the Supabase user id. If the request also includes a different `user_id`, the backend rejects it.

Useful logged-in routes:

- `GET /api/v1/auth/me`
- `GET /api/v1/users/me/profile`
- `GET /api/v1/analysis/me/summary`
- `GET /api/v1/dashboard/me/summary`

## Environment

Copy `.env.example` to `.env`.

```bash
copy .env.example .env
```

## Supabase Setup

The backend is configured for Supabase through `.env`:

- `SUPABASE_URL`
- `SUPABASE_API_KEY`
- `SUPABASE_ENABLED=true`

Before running the API, open your Supabase project SQL editor and run:

```sql
-- see supabase_schema.sql
```

The schema creates:

- `studymind_profiles`
- `studymind_onboarding`
- `studymind_quizzes`
- `studymind_attempts`
- `studymind_revisions`

For a hackathon demo, the SQL includes permissive anon/authenticated policies. For production, replace those policies with user-scoped Firebase/Supabase Auth rules.

## Indian / VTU Domain Detection

The onboarding survey is tuned for Indian engineering students, with VTU B.E. CSE as the starter context. When the survey mentions VTU, B.E., CSE, Computer Science, semester subjects, placements, or GATE-style prep, StudyMind can return domains such as:

- VTU B.E. CSE Core
- VTU Programming and Labs
- VTU AI, ML and Data
- VTU Systems, Cloud and Security
- Indian Competitive and Placement Prep
- Indian Engineering Foundations

The onboarding result also returns `starter_material_sources`, currently seeded from VTU's official B.E. scheme and syllabus page:

- https://vtu.ac.in/b-e-scheme-syllabus/
- https://vtu.ac.in/pdf/2022_3to8/38csesch.pdf
- https://vtu.ac.in/pdf/2022_3to8/2csessyll.pdf
- https://vtu.ac.in/pdf/2022_3to8/3csesyll.pdf
- https://vtu.ac.in/pdf/2022_3to8/6csesyll.pdf

Future notebook/material fetching should use these source links as the first retrieval targets before adding uploaded PDFs, college notes, or previous-year papers.

## Gemini Socratic Tutor

The `/api/v1/chat` endpoint uses Gemini when `GEMINI_API_KEY` is present. Without a key, it falls back to a local Socratic response so the demo still works.

1. Open Google AI Studio.
2. Create or copy a Gemini API key.
3. Add it to `.env`:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
GEMINI_MODEL=gemini-2.5-flash
```

4. Restart the backend.
5. Test `POST /api/v1/chat` in `http://127.0.0.1:8000/docs`.

The chat response includes `provider`:

- `gemini`: Gemini answered
- `local`: no Gemini key was configured
- `local-fallback`: Gemini failed, so the backend used the local tutor
