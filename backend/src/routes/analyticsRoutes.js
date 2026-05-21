import { Router } from 'express';
import { heatmap, summary, weekly } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);
analyticsRoutes.get('/summary', asyncHandler(summary));
analyticsRoutes.get('/weekly', asyncHandler(weekly));
analyticsRoutes.get('/heatmap', asyncHandler(heatmap));
