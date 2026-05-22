import { getFirebaseApp } from '../notifications/firebase.js';
import { Notification } from '../models/Notification.js';

export async function registerScheduledNotification({
  userId,
  taskId,
  scheduledFor,
  deviceToken,
  aiMessage,
  channel = deviceToken ? 'fcm' : 'local',
  escalationLevel = 0,
  reminderStage,
  ignoredCount = escalationLevel
}) {
  const stage = reminderStage || getReminderStage(escalationLevel);
  return Notification.create({
    userId,
    taskId,
    scheduledFor,
    deviceToken,
    aiMessage,
    channel,
    escalationLevel,
    reminderStage: stage,
    ignoredCount,
    snoozed: false,
    completed: false,
    reminderTriggered: false,
    status: 'scheduled'
  });
}

export async function replaceTaskReminder({ userId, task, deviceToken }) {
  await cancelTaskReminders({ userId, taskId: task._id });

  if (!task.reminderTime || task.completionStatus === 'completed') return null;
  if (task.reminderTime.getTime() <= Date.now() - 60 * 1000) return null;

  return registerScheduledNotification({
    userId,
    taskId: task._id,
    scheduledFor: task.reminderTime,
    deviceToken,
    channel: deviceToken ? 'fcm' : 'local'
  });
}

export async function cancelTaskReminders({ userId, taskId }) {
  await Notification.updateMany(
    { userId, taskId, status: { $in: ['scheduled', 'snoozed', 'sent'] } },
    { $set: { status: 'cancelled', completed: true } }
  );
}

export function getReminderStage(escalationLevel = 0) {
  if (escalationLevel >= 2) return 'final-reminder';
  if (escalationLevel === 1) return 'second-reminder';
  return 'first-reminder';
}

export async function sendHighPriorityNotification({ token, title, body, data = {} }) {
  const app = getFirebaseApp();
  if (!app) {
    return { provider: 'disabled', messageId: null };
  }

  const response = await app.messaging().send({
    token,
    notification: { title, body },
    android: {
      priority: 'high',
      notification: {
        channelId: 'discipline_ai_voice_silent',
        priority: 'max',
        defaultSound: false
      }
    },
    apns: {
      payload: {
        aps: {
          alert: { title, body }
        }
      }
    },
    webpush: {
      notification: {
        title,
        body,
        silent: true
      }
    },
    data
  });

  return { provider: 'fcm', messageId: response };
}
