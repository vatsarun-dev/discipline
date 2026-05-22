import { Task } from '../models/Task.js';
import { generateCoachingResponse } from '../services/aiService.js';
import { logActivity } from '../services/activityService.js';
import { cancelTaskReminders, replaceTaskReminder } from '../services/notificationService.js';
import { taskCreateSchema, taskUpdateSchema } from '../validators/taskSchemas.js';

export async function listTasks(req, res) {
  const tasks = await Task.find({ userId: req.user._id }).sort({ reminderTime: 1, createdAt: -1 });
  return res.json({ tasks });
}

export async function createTask(req, res) {
  const input = taskCreateSchema.parse(req.body);
  const aiLine = await generateTaskAccountabilityLine({ user: req.user, task: input });
  const description = mergeDescriptionWithAiLine(input.description, aiLine);
  const task = await Task.create({ ...input, description, userId: req.user._id });
  const notification = await replaceTaskReminder({ userId: req.user._id, task, deviceToken: getLatestDeviceToken(req.user) });
  await logActivity({
    userId: req.user._id,
    taskId: task._id,
    type: 'task_created',
    metadata: { event: 'task_created', reminderScheduled: Boolean(notification) }
  });
  return res.status(201).json({ task, notification });
}

async function generateTaskAccountabilityLine({ user, task }) {
  const response = await generateCoachingResponse({
    user,
    task: {
      ...task,
      completionStatus: 'pending',
      streakCount: 0
    },
    behavior: {
      delayMinutes: 0,
      escalationLevel: 0,
      missedTasksThisWeek: 0,
      delayedCompletionsToday: 0,
      repeatedExcuses: []
    }
  });

  return compactLine(response.text);
}

function mergeDescriptionWithAiLine(description = '', aiLine = '') {
  const userDescription = String(description || '').trim();
  const line = String(aiLine || '').trim();
  if (!line) return userDescription;
  if (!userDescription) return line;
  return `${userDescription}\n${line}`;
}

function compactLine(value = '') {
  const line = String(value)
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!line) return '';
  return line.length > 180 ? `${line.slice(0, 177).trim()}...` : line;
}

export async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  return res.json({ task });
}

export async function updateTask(req, res) {
  const input = taskUpdateSchema.parse(req.body);
  const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, input, {
    new: true,
    runValidators: true
  });

  if (!task) return res.status(404).json({ message: 'Task not found' });
  const shouldReschedule = Object.hasOwn(input, 'reminderTime') || Object.hasOwn(input, 'completionStatus');
  const notification = shouldReschedule
    ? await replaceTaskReminder({ userId: req.user._id, task, deviceToken: getLatestDeviceToken(req.user) })
    : null;
  await logActivity({
    userId: req.user._id,
    taskId: task._id,
    type: 'task_delayed',
    metadata: { update: input, reminderScheduled: Boolean(notification) }
  });
  return res.json({ task });
}

export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await cancelTaskReminders({ userId: req.user._id, taskId: task._id });
  await logActivity({ userId: req.user._id, taskId: task._id, type: 'task_deleted', metadata: { deleted: true } });
  return res.status(204).send();
}

export async function completeTask(req, res) {
  const existing = await Task.findOne({ _id: req.params.id, userId: req.user._id });
  if (!existing) return res.status(404).json({ message: 'Task not found' });

  const now = new Date();
  const nextReminderTime = getNextReminderTime(existing.reminderTime, existing.repeatPattern);
  const update = {
    completedAt: now,
    lastMissedAt: undefined
  };

  if (nextReminderTime) {
    update.completionStatus = 'pending';
    update.reminderTime = nextReminderTime;
  } else {
    update.completionStatus = 'completed';
  }

  const task = await Task.findOneAndUpdate(
    { _id: existing._id, userId: req.user._id },
    { $set: update, $inc: { streakCount: 1 } },
    { new: true }
  );

  await cancelTaskReminders({ userId: req.user._id, taskId: task._id });
  const notification = nextReminderTime ? await replaceTaskReminder({ userId: req.user._id, task, deviceToken: getLatestDeviceToken(req.user) }) : null;
  const delayMinutes = existing.reminderTime ? Math.max(0, Math.round((now.getTime() - existing.reminderTime.getTime()) / 60000)) : 0;
  await logActivity({
    userId: req.user._id,
    taskId: task._id,
    type: 'task_completed',
    delayMinutes,
    metadata: { completedAt: task.completedAt, nextReminderTime, reminderScheduled: Boolean(notification) }
  });
  return res.json({ task });
}

export async function snoozeTask(req, res) {
  const minutes = Number(req.body.minutes || 10);
  const reminderTime = new Date(Date.now() + minutes * 60 * 1000);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { completionStatus: 'snoozed', reminderTime },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: 'Task not found' });
  await replaceTaskReminder({ userId: req.user._id, task, deviceToken: getLatestDeviceToken(req.user) });
  await logActivity({ userId: req.user._id, taskId: task._id, type: 'snoozed', metadata: { minutes } });
  return res.json({ task });
}

export async function markMissed(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { completionStatus: 'missed', lastMissedAt: new Date(), streakCount: 0 },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: 'Task not found' });
  await cancelTaskReminders({ userId: req.user._id, taskId: task._id });
  await logActivity({ userId: req.user._id, taskId: task._id, type: 'task_missed' });
  return res.json({ task });
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

function getLatestDeviceToken(user) {
  return [...(user.deviceTokens || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.token;
}
