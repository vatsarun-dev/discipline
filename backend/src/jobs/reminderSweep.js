import cron from 'node-cron';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { generateCoachingResponse } from '../services/aiService.js';
import { generateVoice } from '../services/voiceService.js';
import { sendHighPriorityNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

export function startReminderSweep() {
  cron.schedule('* * * * *', async () => {
    const due = await Notification.find({
      status: 'scheduled',
      scheduledFor: { $lte: new Date() }
    }).limit(25);

    for (const notification of due) {
      await processDueNotification(notification);
    }
  });
}

async function processDueNotification(notification) {
  try {
    const [user, task] = await Promise.all([
      User.findById(notification.userId).select('-passwordHash'),
      notification.taskId ? Task.findOne({ _id: notification.taskId, userId: notification.userId }) : null
    ]);

    if (!user) {
      await markFailed(notification, 'User not found for due notification');
      return;
    }

    const coaching = await generateCoachingResponse({
      user,
      task,
      behavior: {
        missedTasksThisWeek: task?.completionStatus === 'missed' ? 1 : 0,
        delayedCompletionsToday: task?.completionStatus === 'snoozed' ? 1 : 0,
        repeatedExcuses: []
      }
    });

    const voice = await generateVoice({ text: coaching.text });
    const push = notification.deviceToken
      ? await sendHighPriorityNotification({
          token: notification.deviceToken,
          title: task?.title || 'DisciplineOS reminder',
          body: coaching.text,
          data: {
            notificationId: notification._id.toString(),
            taskId: task?._id?.toString() || '',
            voiceUrl: voice.audioUrl || ''
          }
        })
      : { provider: 'disabled', messageId: null };

    notification.status = 'sent';
    notification.aiMessage = coaching.text;
    notification.voiceCacheUrl = voice.audioUrl;
    notification.voiceProvider = voice.provider;
    notification.voiceGeneratedAt = voice.provider === 'elevenlabs' ? new Date() : undefined;
    notification.sentAt = new Date();
    notification.lastError = undefined;
    await notification.save();

    await logActivity({
      userId: notification.userId,
      taskId: task?._id,
      type: 'alarm_acknowledged',
      metadata: {
        notificationId: notification._id,
        aiProvider: coaching.provider,
        voiceProvider: voice.provider,
        pushProvider: push.provider
      }
    });

    console.log(`Reminder sent: ${notification._id}`);
  } catch (error) {
    await markFailed(notification, error.message);
  }
}

export async function processDueNotificationsForUser(userId) {
  const due = await Notification.find({
    userId,
    status: 'scheduled',
    scheduledFor: { $lte: new Date() }
  }).limit(25);

  for (const notification of due) {
    await processDueNotification(notification);
  }

  return due.length;
}

async function markFailed(notification, message) {
  notification.status = 'failed';
  notification.lastError = message;
  notification.retryCount += 1;
  await notification.save();
  console.error(`Reminder failed: ${notification._id} - ${message}`);
}
