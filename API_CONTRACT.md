# API Contract

Base path: `/api`

Authentication: protected routes require `Authorization: Bearer <jwt>`.

## Auth

- `POST /auth/signup`: create user and return token.
- `POST /auth/login`: authenticate user and return token.
- `GET /auth/me`: return current user.
- `PATCH /auth/onboarding`: update onboarding profile.

## Tasks

- `GET /tasks`: list current user's tasks.
- `POST /tasks`: create task.
- `GET /tasks/:id`: get task.
- `PATCH /tasks/:id`: update task.
- `DELETE /tasks/:id`: delete task.
- `POST /tasks/:id/complete`: complete task and log activity.
- `POST /tasks/:id/snooze`: snooze task reminder.
- `POST /tasks/:id/missed`: mark task as missed and trigger accountability flow.

## Activities

- `GET /activities`: list current user's activity history.
- `POST /activities`: create activity event.
- `PATCH /activities/:id`: update activity status, metadata, delay timing, or event details.
- `DELETE /activities/:id`: delete activity event.

## AI

- `GET /ai/personalities`: list default and custom personalities.
- `POST /ai/personalities`: create custom personality.
- `PATCH /ai/personalities/:id`: update custom personality.
- `DELETE /ai/personalities/:id`: delete custom personality.
- `POST /ai/coach`: generate contextual coaching response.

## Analytics

- `GET /analytics/summary`: return dashboard summary.
- `GET /analytics/weekly`: return weekly trend data.
- `GET /analytics/heatmap`: return completion heatmap data.

## Notifications

- `GET /notifications`: list scheduled reminders.
- `POST /notifications/register-device`: register FCM/Expo push token.
- `POST /notifications/schedule`: schedule reminder.
- `PATCH /notifications/:id`: update reminder settings or status.
- `DELETE /notifications/:id`: delete reminder.
- `POST /notifications/process-due`: process current user's due scheduled reminders immediately for testing/manual execution.
- `POST /notifications/:id/snooze`: snooze notification.
- `POST /notifications/:id/acknowledge`: acknowledge notification.

## Integrations

- `POST /integrations/notion/daily-report`: export daily report to Notion.
- `POST /integrations/notion/weekly-summary`: export weekly summary to Notion.
