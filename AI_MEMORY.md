# AI Memory

## Product Memory

- The application must preserve a premium, cinematic, dark operating-system feeling.
- The task model includes strictness, streaks, reminders, repeat patterns, and completion state.
- AI coaching should avoid generic templates and should adapt to missed tasks, delayed completion, wake failures, excuses, and consistency trends.
- Battery optimization is a first-class requirement: no constant polling, cache voice responses, generate AI only on important events, and prefer scheduled/event-driven notifications.

## Engineering Memory

- Backend source lives in `backend/src`.
- Web source lives in `frontend/src`.
- Mobile source lives in `mobile/src`.
- Web UI direction is a Vercel-like monochrome console: black background, crisp borders, compact panels, restrained typography, and functional navigation.
- Sidebar navigation switches real views. Core web data must come from backend APIs, not local mock arrays.
- Auth uses `disciplineos_token` in localStorage and restores sessions through `GET /api/auth/me`.
- Frontend API functions live in `frontend/src/lib/api.js`.
- Web API default is `https://discipline-zgl3.onrender.com/api`; local development can override with `frontend/.env` and `VITE_API_URL=http://localhost:5000/api`.
- Backend activity CRUD lives under `/api/activities`.
- AI Coach uses `GEMINI_MODEL`, defaulting to `gemini-2.0-flash`, and returns a fallback response instead of failing the route when Gemini rejects the request.
- AI Coach also supports Groq via `AI_PROVIDER=groq`, `GROQ_API_KEY`, and `GROQ_MODEL`. Keep real provider keys only in `backend/.env`.
- Reminder processing lives in `backend/src/jobs/reminderSweep.js` and uses AI coaching plus ElevenLabs voice generation for due scheduled notifications.
- Update `DATABASE_SCHEMA.md` when Mongoose models change.
- Update `API_CONTRACT.md` when Express routes change.
- Update this file when project conventions or durable decisions change.

## Open Decisions

- Choose exact Gemini model and safety settings after API key and product tone guidelines are finalized.
- Decide whether Expo managed workflow is enough for fullscreen alarm behavior or whether a native module/eject path is needed.
- Define Notion database templates for daily reports and weekly summaries.
