import { z } from 'zod';

export const notificationCreateSchema = z.object({
  taskId: z.string().optional(),
  deviceToken: z.string().optional(),
  channel: z.enum(['fcm', 'expo', 'local']).optional(),
  scheduledFor: z.coerce.date(),
  aiMessage: z.string().max(1000).optional(),
  voiceCacheUrl: z.string().url().optional()
});

export const notificationUpdateSchema = notificationCreateSchema.partial().extend({
  status: z.enum(['scheduled', 'sent', 'snoozed', 'acknowledged', 'failed']).optional(),
  retryCount: z.coerce.number().min(0).optional(),
  snoozedUntil: z.coerce.date().optional()
});
