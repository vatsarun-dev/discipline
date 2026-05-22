import cron from 'node-cron';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { generateCoachingResponse } from '../services/aiService.js';
import { selectPredefinedAudio, stageCopy } from '../services/predefinedAudioService.js';
import { getReminderStage, registerScheduledNotification, sendHighPriorityNotification } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';
import { env } from '../config/env.js';

const escalationDelaysMinutes = [3, 5];

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

    if (task?.completionStatus === 'completed') {
      notification.status = 'cancelled';
      notification.lastError = undefined;
      await notification.save();
      return;
    }

    const behavior = await buildBehaviorContext({ userId: notification.userId, task, notification });

    const coaching = await generateCoachingResponse({
      user,
      task,
      behavior
    });

    const reminderStage = getReminderStage(notification.escalationLevel || 0);
    const voice = await safeSelectReminderAudio({
      notification,
      stage: reminderStage,
      seed: `${notification.userId}:${notification.taskId || 'general'}:${notification._id}`
    });
    const message = coaching.text || stageCopy(reminderStage);
    const push = notification.deviceToken
      ? await sendHighPriorityNotification({
          token: notification.deviceToken,
          title: task?.title || 'DisciplineOS reminder',
          body: message,
          data: {
            notificationId: notification._id.toString(),
            taskId: task?._id?.toString() || '',
            reminderStage,
            escalationLevel: String(notification.escalationLevel || 0),
            voiceUrl: toPublicUrl(voice.audioUrl)
          }
        })
      : { provider: 'disabled', messageId: null };

    notification.status = 'sent';
    notification.aiMessage = message;
    notification.voiceCacheUrl = voice.audioUrl;
    notification.voiceProvider = voice.provider;
    notification.voiceGeneratedAt = voice.provider === 'predefined' ? new Date() : undefined;
    notification.reminderStage = reminderStage;
    notification.lastPlayedAudio = voice.audioUrl || notification.lastPlayedAudio;
    notification.reminderTriggered = true;
    notification.snoozed = false;
    notification.ignoredCount = notification.escalationLevel || 0;
    notification.sentAt = new Date();
    notification.lastError = voice.error ? `Voice generation failed: ${voice.error}` : undefined;
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

    await updateTaskAfterAlarm({ notification, task });
    await scheduleEscalationIfNeeded({ notification, task, lastPlayedAudio: voice.audioUrl });

    console.log(`Reminder sent: ${notification._id}`);
  } catch (error) {
    await markFailed(notification, error.message);
  }
}

function toPublicUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return env.apiPublicUrl ? `${env.apiPublicUrl.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}` : value;
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

async function buildBehaviorContext({ userId, task, notification }) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [weeklyActivities, dailyActivities] = await Promise.all([
    Activity.find({ userId, occurredAt: { $gte: weekAgo } }).sort({ occurredAt: -1 }).limit(120),
    Activity.find({ userId, occurredAt: { $gte: dayAgo } }).sort({ occurredAt: -1 }).limit(60)
  ]);

  const delayMinutes = task?.reminderTime
    ? Math.max(0, Math.round((Date.now() - task.reminderTime.getTime()) / 60000))
    : Math.max(0, Math.round((Date.now() - notification.scheduledFor.getTime()) / 60000));

  return {
    delayMinutes,
    escalationLevel: notification.escalationLevel || 0,
    missedTasksThisWeek: weeklyActivities.filter((activity) => activity.type === 'task_missed').length,
    delayedCompletionsToday: dailyActivities.filter((activity) => activity.delayMinutes > 0 || activity.type === 'snoozed').length,
    wakeFailuresThisWeek: weeklyActivities.filter((activity) => activity.type === 'wake_failed').length,
    repeatedExcuses: weeklyActivities
      .filter((activity) => activity.type === 'excuse_logged' && activity.metadata?.excuse)
      .map((activity) => activity.metadata.excuse)
      .slice(0, 4),
    recentCompletions: weeklyActivities.filter((activity) => activity.type === 'task_completed').length,
    taskStreak: task?.streakCount || 0,
    lastMissedAt: task?.lastMissedAt
  };
}

async function safeSelectReminderAudio({ notification, stage, seed }) {
  try {
    return await selectPredefinedAudio({
      stage,
      lastPlayedAudio: notification.lastPlayedAudio,
      seed
    });
  } catch (error) {
    console.error('Predefined reminder audio failed:', error.message);
    return { audioUrl: null, cached: false, provider: 'predefined-failed', error: error.message };
  }
}

async function updateTaskAfterAlarm({ notification, task }) {
  if (!task || task.completionStatus === 'completed') return;

  if ((notification.escalationLevel || 0) >= 3) {
    const nextReminderTime = getNextReminderTime(task.reminderTime, task.repeatPattern);
    task.completionStatus = nextReminderTime ? 'pending' : 'missed';
    task.lastMissedAt = new Date();
    task.streakCount = 0;
    if (nextReminderTime) task.reminderTime = nextReminderTime;
    await task.save();
    await logActivity({
      userId: notification.userId,
      taskId: task._id,
      type: 'task_missed',
      metadata: { notificationId: notification._id, escalationLevel: notification.escalationLevel }
    });

    if (nextReminderTime) {
      await registerScheduledNotification({
        userId: notification.userId,
        taskId: task._id,
        scheduledFor: nextReminderTime,
        deviceToken: notification.deviceToken,
        channel: notification.channel,
        escalationLevel: 0
      });
    }
  }
}

async function scheduleEscalationIfNeeded({ notification, task, lastPlayedAudio }) {
  if (!task || task.completionStatus === 'completed' || (notification.escalationLevel || 0) >= 2) return;

  const followUpMinutes = escalationDelaysMinutes[notification.escalationLevel || 0] || escalationDelaysMinutes.at(-1);
  const nextLevel = (notification.escalationLevel || 0) + 1;
  const nextStage = getReminderStage(nextLevel);
  await registerScheduledNotification({
    userId: notification.userId,
    taskId: task._id,
    scheduledFor: new Date(Date.now() + followUpMinutes * 60 * 1000),
    deviceToken: notification.deviceToken,
    channel: notification.channel,
    escalationLevel: nextLevel,
    reminderStage: nextStage,
    ignoredCount: nextLevel,
    aiMessage: stageCopy(nextStage)
  });

  await Notification.updateMany(
    {
      userId: notification.userId,
      taskId: task._id,
      status: 'scheduled',
      escalationLevel: nextLevel
    },
    { $set: { lastPlayedAudio } }
  );
}

function getNextReminderTime(currentReminderTime, repeatPattern) {
  if (!currentReminderTime || !repeatPattern || repeatPattern === 'none' || repeatPattern === 'custom') return null;

  const next = new Date(currentReminderTime);
  const now = new Date();

  do {
    if (repeatPattern === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (repeatPattern === 'weekdays') {
      next.setDate(next.getDate() + 1);
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
    } else if (repeatPattern === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (repeatPattern === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else {
      return null;
    }
  } while (next <= now);

  return next;
}
