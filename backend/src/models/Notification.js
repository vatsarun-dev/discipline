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
      enum: ['scheduled', 'sent', 'snoozed', 'acknowledged', 'failed'],
      default: 'scheduled'
    },
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

export const Notification = mongoose.model('Notification', notificationSchema);
