import { getFirebaseApp } from '../notifications/firebase.js';
import { Notification } from '../models/Notification.js';

export async function registerScheduledNotification({ userId, taskId, scheduledFor, deviceToken, aiMessage }) {
  return Notification.create({ userId, taskId, scheduledFor, deviceToken, aiMessage, status: 'scheduled' });
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
        channelId: 'discipline_alarm',
        priority: 'max',
        sound: 'alarm_loop'
      }
    },
    data
  });

  return { provider: 'fcm', messageId: response };
}
