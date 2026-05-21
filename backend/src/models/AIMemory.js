import mongoose from 'mongoose';

const aiMemorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    frequentlyMissedTasks: [String],
    procrastinationPatterns: [String],
    commonFailureTimings: [String],
    preferredCoachingStyle: String,
    emotionalResponsePatterns: [String],
    productivityWindows: [String],
    notes: [{ content: String, createdAt: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

export const AIMemory = mongoose.model('AIMemory', aiMemorySchema);
