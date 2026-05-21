import { Router } from 'express';
import { dailyReport, weeklySummary } from '../controllers/integrationController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const integrationRoutes = Router();

integrationRoutes.use(requireAuth);
integrationRoutes.post('/notion/daily-report', asyncHandler(dailyReport));
integrationRoutes.post('/notion/weekly-summary', asyncHandler(weeklySummary));
