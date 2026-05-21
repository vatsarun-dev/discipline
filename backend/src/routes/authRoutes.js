import { Router } from 'express';
import { signup, login, me, updateOnboarding } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.post('/signup', authLimiter, asyncHandler(signup));
authRoutes.post('/login', authLimiter, asyncHandler(login));
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/onboarding', requireAuth, asyncHandler(updateOnboarding));
