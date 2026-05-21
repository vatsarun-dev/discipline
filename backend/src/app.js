import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/authRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { aiRoutes } from './routes/aiRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { integrationRoutes } from './routes/integrationRoutes.js';
import { activityRoutes } from './routes/activityRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/voice-cache', express.static('storage/voice-cache'));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use('/api', apiLimiter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'disciplineos-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/integrations', integrationRoutes);
  app.use(errorHandler);

  return app;
}
