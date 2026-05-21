import { Router } from 'express';
import { signup, login, me, updateOnboarding } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.get('/signup', (req, res) => {
  res.status(405).json({
    message: 'Signup is a POST API endpoint. Open the frontend app and submit the signup form, or POST JSON to /api/auth/signup.'
  });
});

authRoutes.get('/login', (req, res) => {
  res.status(405).json({
    message: 'Login is a POST API endpoint. Open the frontend app and submit the login form, or POST JSON to /api/auth/login.'
  });
});

authRoutes.post('/signup', authLimiter, asyncHandler(signup));
authRoutes.post('/login', authLimiter, asyncHandler(login));
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/onboarding', requireAuth, asyncHandler(updateOnboarding));
