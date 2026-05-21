import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: {
      type: String,
      enum: ['task_completed', 'task_missed', 'task_delayed', 'wake_failed', 'snoozed', 'excuse_logged', 'alarm_acknowledged'],
      required: true
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['active', 'corrected', 'archived'],
      default: 'active'
    },
    delayMinutes: { type: Number, min: 0, default: 0 },
    occurredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, occurredAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
