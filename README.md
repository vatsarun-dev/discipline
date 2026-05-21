# DisciplineOS

DisciplineOS is a full-stack AI-powered productivity and accountability operating system. It combines task and habit management, behavioral analytics, AI coaching, voice alarms, and Notion reporting into a premium dark-first experience for web and mobile.

## Apps

- `backend`: Node.js, Express, MongoDB, JWT, Gemini, ElevenLabs, Notion, FCM service architecture.
- `frontend`: React, Vite, Tailwind CSS, Framer Motion, Zustand, Axios dashboard.
- `mobile`: Expo React Native skeleton for fullscreen alarm UX, task flow, and notification wiring.

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
npm run dev:backend
npm run dev:web
npm run dev:mobile
```

## Development Rule

When features change, update:

- `PROJECT_CONTEXT.md`
- `AI_MEMORY.md`
- `CHANGELOG.md`
- `DATABASE_SCHEMA.md` if models change
- `API_CONTRACT.md` if routes change
"# discipline" 
