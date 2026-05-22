import mongoose from 'mongoose';

const onboardingSchema = new mongoose.Schema(
  {
    wakeUpTime: String,
    productivityGoals: [String],
    sleepSchedule: {
      bedtime: String,
      wakeTime: String
    },
    focusHours: [String],
    preferredAiPersonality: String,
    strictnessLevel: { type: Number, min: 1, max: 10, default: 6 },
    dailyHabits: [String]
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    onboarding: { type: onboardingSchema, default: {} },
    googleAuth: {
      providerId: String,
      email: String
    },
    deviceTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, enum: ['expo', 'fcm', 'web', 'ios', 'android', 'unknown'], default: 'unknown' },
        updatedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
