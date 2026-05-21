import { z } from 'zod';

export const activityCreateSchema = z.object({
  taskId: z.string().optional(),
  type: z.enum(['task_completed', 'task_missed', 'task_delayed', 'wake_failed', 'snoozed', 'excuse_logged', 'alarm_acknowledged']),
  metadata: z.record(z.any()).optional().default({}),
  status: z.enum(['active', 'corrected', 'archived']).optional(),
  delayMinutes: z.coerce.number().min(0).optional(),
  occurredAt: z.coerce.date().optional()
});

export const activityUpdateSchema = activityCreateSchema.partial();
