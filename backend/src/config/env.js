import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');
const primaryEnvPath = path.join(backendRoot, '.env');
const exampleEnvPath = path.join(backendRoot, '.env.example');

const loaded = dotenv.config({ path: primaryEnvPath });

if (loaded.error && process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: exampleEnvPath });
}

if (process.env.MONGODB_URI?.includes('user:password@cluster.mongodb.net')) {
  delete process.env.MONGODB_URI;
}

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || 'http://localhost:5173',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsDefaultVoiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID,
  notionApiKey: process.env.NOTION_API_KEY,
  notionDailyReportsDatabaseId: process.env.NOTION_DAILY_REPORTS_DATABASE_ID,
  notionWeeklySummariesDatabaseId: process.env.NOTION_WEEKLY_SUMMARIES_DATABASE_ID,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY
};
