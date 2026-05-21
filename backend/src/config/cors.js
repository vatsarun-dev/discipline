import { env } from './env.js';

const allowedOrigins = new Set(
  env.clientOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin) || isAllowedVercelPreview(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  }
};

function isAllowedVercelPreview(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'discipline-frontend-psi.vercel.app' || hostname.startsWith('discipline-frontend-') && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}
