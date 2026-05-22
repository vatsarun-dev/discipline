import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { corsOptions } from './config/cors.js';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const audioAssetsRoot = path.resolve(backendRoot, '..', 'assets', 'audio');

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use('/voice-cache', express.static('storage/voice-cache'));
  app.use('/assets/audio', express.static(audioAssetsRoot, {
    fallthrough: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));
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
