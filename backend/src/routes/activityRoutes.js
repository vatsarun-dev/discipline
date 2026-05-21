import { Router } from 'express';
import { createActivity, deleteActivity, listActivities, updateActivity } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const activityRoutes = Router();

activityRoutes.use(requireAuth);
activityRoutes.get('/', asyncHandler(listActivities));
activityRoutes.post('/', asyncHandler(createActivity));
activityRoutes.patch('/:id', asyncHandler(updateActivity));
activityRoutes.delete('/:id', asyncHandler(deleteActivity));
