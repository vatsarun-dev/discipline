import { Router } from 'express';
import { coach, createPersonality, deletePersonality, listPersonalities, updatePersonality } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const aiRoutes = Router();

aiRoutes.use(requireAuth);
aiRoutes.get('/personalities', asyncHandler(listPersonalities));
aiRoutes.post('/personalities', asyncHandler(createPersonality));
aiRoutes.patch('/personalities/:id', asyncHandler(updatePersonality));
aiRoutes.delete('/personalities/:id', asyncHandler(deletePersonality));
aiRoutes.post('/coach', asyncHandler(coach));
