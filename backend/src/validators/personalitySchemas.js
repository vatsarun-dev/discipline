import { z } from 'zod';

export const personalityCreateSchema = z.object({
  name: z.string().min(1).max(80),
  tone: z.string().min(1).max(120),
  speakingStyle: z.string().min(1).max(240),
  aggressionLevel: z.coerce.number().min(1).max(10).optional(),
  motivationalStyle: z.string().min(1).max(240),
  voiceType: z.string().max(120).optional()
});

export const personalityUpdateSchema = personalityCreateSchema.partial();
