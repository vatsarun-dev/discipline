# DisciplineOS Project Context

## Vision

DisciplineOS is a futuristic AI accountability operating system for users who struggle with laziness, procrastination, weak routines, and inconsistent habits. It must feel like a premium behavioral coaching system, not a generic to-do app.

## Product Principles

- Dark-first, premium SaaS interface inspired by Vercel, Linear, Notion, and Arc Browser.
- AI coaching should be contextual, emotionally resonant, and personality-aware.
- Reminder and alarm systems must be event-driven and battery-conscious.
- MongoDB is the primary source of truth; Notion is for exported logs, journals, summaries, and reflections.
- Mobile alarm flows should feel immersive and difficult to ignore while remaining respectful of OS constraints.

## Current Implementation

- Monorepo with backend, frontend, and mobile apps.
- Backend includes modular Express architecture, MongoDB models, JWT auth, task CRUD, activity CRUD, AI personality CRUD, analytics, notification CRUD, AI coaching, Notion, ElevenLabs, and Firebase service boundaries.
- Due reminders are processed by a one-minute reminder sweep. The sweep generates AI accountability text, synthesizes ElevenLabs voice when configured, persists the generated voice cache URL, and optionally sends high-priority FCM if a device token exists.
- Frontend is a Vercel-style authenticated console with real Axios integration, token persistence, session restoration, protected app state, Overview, Tasks, AI Coach, Analytics, and Alarms pages.
- Frontend defaults to the deployed Render API at `https://discipline-zgl3.onrender.com/api`; override with `VITE_API_URL` when using a local backend.
- Web core data now comes from the backend: tasks, activities, analytics, personalities, and notifications are loaded from MongoDB-backed APIs.
- Mobile includes an Expo shell with dashboard and fullscreen alarm screen concepts; native notification execution still needs full API synchronization.

## Verification

- Web production build passes.
- Backend JavaScript syntax check passes.
- Backend app import passes.
- MongoDB Atlas connectivity was verified.
- End-to-end API smoke test passed: signup, JWT auth, task create, task complete, activity log, analytics summary.

## MVP Phases

1. Authentication, task CRUD, dashboard UI, MongoDB integration.
2. Reminder system, push notifications, habit tracking, activity logging.
3. AI coaching system, personality engine, Gemini integration.
4. Voice generation, analytics dashboard, Notion integration.
5. Mobile optimization, battery optimization, advanced accountability.
