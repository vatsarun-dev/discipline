import { Router } from 'express';
import {
  acknowledge,
  deleteNotification,
  listNotifications,
  processDue,
  registerDevice,
  schedule,
  snooze,
  updateNotification
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
notificationRoutes.get('/', asyncHandler(listNotifications));
notificationRoutes.post('/register-device', asyncHandler(registerDevice));
notificationRoutes.post('/schedule', asyncHandler(schedule));
notificationRoutes.post('/process-due', asyncHandler(processDue));
notificationRoutes.patch('/:id', asyncHandler(updateNotification));
notificationRoutes.delete('/:id', asyncHandler(deleteNotification));
notificationRoutes.post('/:id/snooze', asyncHandler(snooze));
notificationRoutes.post('/:id/acknowledge', asyncHandler(acknowledge));
