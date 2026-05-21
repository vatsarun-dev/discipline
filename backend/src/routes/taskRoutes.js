import { Router } from 'express';
import {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  markMissed,
  snoozeTask,
  updateTask
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);
taskRoutes.get('/', asyncHandler(listTasks));
taskRoutes.post('/', asyncHandler(createTask));
taskRoutes.get('/:id', asyncHandler(getTask));
taskRoutes.patch('/:id', asyncHandler(updateTask));
taskRoutes.delete('/:id', asyncHandler(deleteTask));
taskRoutes.post('/:id/complete', asyncHandler(completeTask));
taskRoutes.post('/:id/snooze', asyncHandler(snoozeTask));
taskRoutes.post('/:id/missed', asyncHandler(markMissed));
