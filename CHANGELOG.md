# Changelog

## 0.1.0 - Initial Scaffold

- Created DisciplineOS monorepo with backend, frontend, and mobile app folders.
- Added living project documentation and development continuity rules.
- Added backend Express/Mongo/JWT scaffold with service modules for AI, voice, analytics, Notion, and notifications.
- Added web dashboard scaffold with dark premium UI, Zustand stores, and Framer Motion interactions.
- Added Expo mobile scaffold with dashboard and fullscreen alarm UI concepts.

## Unreleased

- Reworked the web app into a Vercel-style console UI with working sidebar page navigation.
- Replaced frontend mock task state with real Axios-backed API calls.
- Added authenticated login/signup/logout/session restoration in the web app.
- Added task create, complete, missed, snooze, and delete flows through protected backend APIs.
- Added activity CRUD API routes.
- Added AI personality delete support and frontend personality CRUD surface.
- Added notification list, update, delete, snooze, and acknowledge backend routes plus web reminder scheduling UI.
- Reworked analytics to calculate weekly trends and heatmaps from real activity records.
- Added separate Overview, Tasks, AI Coach, Analytics, and Alarms pages.
- Made Gemini model configurable through `GEMINI_MODEL` and added safe AI Coach fallback when Gemini returns provider errors such as unavailable model or quota limits.
- Added Groq as an AI Coach provider through `AI_PROVIDER=groq`, `GROQ_API_KEY`, and `GROQ_MODEL`.
- Sanitized `backend/.env.example` so real secrets are not stored in the example file.
- Upgraded reminder processing to generate AI accountability text and ElevenLabs voice audio for due reminders.
- Added `POST /api/notifications/process-due` for manual due reminder processing during web testing.
