import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    deviceToken: String,
    channel: { type: String, enum: ['fcm', 'expo', 'local'], default: 'fcm' },
    scheduledFor: Date,
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'snoozed', 'acknowledged', 'failed', 'cancelled'],
      default: 'scheduled'
    },
    escalationLevel: { type: Number, min: 0, max: 5, default: 0 },
    reminderStage: {
      type: String,
      enum: ['first-reminder', 'second-reminder', 'final-reminder'],
      default: 'first-reminder'
    },
    lastPlayedAudio: String,
    reminderTriggered: { type: Boolean, default: false },
    snoozed: { type: Boolean, default: false },
    ignoredCount: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false },
    aiMessage: String,
    voiceCacheUrl: String,
    voiceProvider: String,
    voiceGeneratedAt: Date,
    sentAt: Date,
    lastError: String,
    retryCount: { type: Number, default: 0 },
    snoozedUntil: Date
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, scheduledFor: 1 });
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ taskId: 1, status: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
