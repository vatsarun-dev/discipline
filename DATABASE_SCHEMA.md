# Database Schema

MongoDB is the primary database. Notion is used only for reports, journals, summaries, and reflections.

## Users

Fields:

- `name`: string, required
- `email`: string, required, unique
- `passwordHash`: string, required
- `onboarding`: object with wake time, productivity goals, sleep schedule, focus hours, preferred personality, strictness level, and daily habits
- `googleAuth`: future-ready object for provider id and email
- `createdAt`, `updatedAt`

## Tasks

Fields:

- `userId`: ObjectId ref `User`, required
- `title`: string, required
- `description`: string
- `category`: string
- `reminderTime`: date
- `repeatPattern`: enum `none`, `daily`, `weekdays`, `weekly`, `monthly`, `custom`
- `priority`: enum `low`, `medium`, `high`, `critical`
- `aiStrictness`: number 1-10
- `completionStatus`: enum `pending`, `completed`, `missed`, `snoozed`
- `streakCount`: number
- `completedAt`: date
- `lastMissedAt`: date
- `createdAt`, `updatedAt`

## Activities

Tracks behavioral events including task completion, missed tasks, delays, wake failures, snoozes, excuses, and alarm interactions.

Fields:

- `userId`: ObjectId ref `User`, required
- `taskId`: ObjectId ref `Task`
- `type`: enum `task_completed`, `task_missed`, `task_delayed`, `wake_failed`, `snoozed`, `excuse_logged`, `alarm_acknowledged`
- `metadata`: mixed object
- `status`: enum `active`, `corrected`, `archived`
- `delayMinutes`: number
- `occurredAt`: date
- `createdAt`, `updatedAt`

## AI Personalities

Stores default and custom coaching personas with tone, speaking style, aggression level, motivational style, and voice type.

## AI Memory

Stores recurring missed tasks, procrastination windows, failure timings, preferred coaching style, emotional response patterns, and productivity windows.

## Analytics

Stores daily/weekly metrics including discipline score, laziness score, consistency percentage, habit completion rate, active hours, and trend data.

## Notifications

Stores scheduled reminders, delivery attempts, snooze state, generated AI message, generated voice cache URL, and notification lifecycle status.

Additional lifecycle fields:

- `voiceProvider`: text-to-speech provider used, for example `elevenlabs`
- `voiceGeneratedAt`: date when the voice file was generated
- `sentAt`: date when the due reminder was processed/sent
- `lastError`: latest processing or delivery error

Indexes now cover task reminder queries, activity history queries, personality lookup, and notification status/schedule queries.
