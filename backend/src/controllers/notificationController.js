import { Notification } from '../models/Notification.js';
import { registerScheduledNotification } from '../services/notificationService.js';
import { notificationCreateSchema, notificationUpdateSchema } from '../validators/notificationSchemas.js';
import { processDueNotificationsForUser } from '../jobs/reminderSweep.js';

export async function registerDevice(req, res) {
  const deviceToken = String(req.body.deviceToken || '').trim();
  if (!deviceToken) return res.status(400).json({ message: 'deviceToken is required' });

  req.user.deviceTokens = [
    ...(req.user.deviceTokens || []).filter((item) => item.token !== deviceToken),
    {
      token: deviceToken,
      platform: req.body.platform || req.body.channel || 'unknown',
      updatedAt: new Date()
    }
  ].slice(-5);
  await req.user.save();

  return res.json({ deviceToken, status: 'registered' });
}

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ scheduledFor: 1, createdAt: -1 });
  return res.json({ notifications });
}

export async function schedule(req, res) {
  const input = notificationCreateSchema.parse(req.body);
  const notification = await registerScheduledNotification({
    userId: req.user._id,
    taskId: input.taskId,
    scheduledFor: input.scheduledFor,
    deviceToken: input.deviceToken || getLatestDeviceToken(req.user),
    aiMessage: input.aiMessage,
    channel: input.channel,
    reminderStage: input.reminderStage,
    ignoredCount: input.ignoredCount || 0
  });

  return res.status(201).json({ notification });
}

function getLatestDeviceToken(user) {
  return [...(user.deviceTokens || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.token;
}

export async function updateNotification(req, res) {
  const input = notificationUpdateSchema.parse(req.body);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    input,
    { new: true, runValidators: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function deleteNotification(req, res) {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.status(204).send();
}

export async function snooze(req, res) {
  const minutes = Number(req.body.minutes || 10);
  const scheduledFor = new Date(Date.now() + minutes * 60 * 1000);
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      status: 'scheduled',
      scheduledFor,
      snoozedUntil: scheduledFor,
      snoozed: true,
      reminderTriggered: false,
      sentAt: undefined
    },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function acknowledge(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: 'acknowledged', reminderTriggered: false },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function processDue(req, res) {
  const processed = await processDueNotificationsForUser(req.user._id);
  return res.json({ processed });
}
