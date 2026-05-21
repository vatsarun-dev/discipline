import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is required. Create backend/.env with your real MongoDB Atlas connection string; .env.example is only a placeholder.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  console.log('MongoDB connected');
}
