import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    reminderTime: Date,
    repeatPattern: {
      type: String,
      enum: ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'],
      default: 'none'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    aiStrictness: { type: Number, min: 1, max: 10, default: 6 },
    completionStatus: {
      type: String,
      enum: ['pending', 'completed', 'missed', 'snoozed'],
      default: 'pending'
    },
    streakCount: { type: Number, default: 0 },
    completedAt: Date,
    lastMissedAt: Date
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, completionStatus: 1 });
taskSchema.index({ userId: 1, reminderTime: 1 });

export const Task = mongoose.model('Task', taskSchema);
