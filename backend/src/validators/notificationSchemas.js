import { z } from 'zod';

export const notificationCreateSchema = z.object({
  taskId: z.string().optional(),
  deviceToken: z.string().optional(),
  channel: z.enum(['fcm', 'expo', 'local']).optional(),
  scheduledFor: z.coerce.date(),
  aiMessage: z.string().max(1000).optional(),
  voiceCacheUrl: z.string().optional(),
  reminderStage: z.enum(['first-reminder', 'second-reminder', 'final-reminder']).optional(),
  lastPlayedAudio: z.string().optional(),
  reminderTriggered: z.boolean().optional(),
  snoozed: z.boolean().optional(),
  ignoredCount: z.coerce.number().min(0).optional(),
  completed: z.boolean().optional()
});

export const notificationUpdateSchema = notificationCreateSchema.partial().extend({
  status: z.enum(['scheduled', 'sent', 'snoozed', 'acknowledged', 'failed', 'cancelled']).optional(),
  escalationLevel: z.coerce.number().min(0).max(5).optional(),
  retryCount: z.coerce.number().min(0).optional(),
  snoozedUntil: z.coerce.date().optional()
});
