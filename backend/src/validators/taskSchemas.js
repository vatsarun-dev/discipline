import { z } from 'zod';

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional().default(''),
  category: z.string().max(80).optional().default('General'),
  reminderTime: z.coerce.date().optional(),
  repeatPattern: z.enum(['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  aiStrictness: z.coerce.number().min(1).max(10).optional()
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  completionStatus: z.enum(['pending', 'completed', 'missed', 'snoozed']).optional(),
  streakCount: z.coerce.number().min(0).optional()
});
