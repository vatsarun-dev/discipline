import { Notification } from '../models/Notification.js';
import { registerScheduledNotification } from '../services/notificationService.js';
import { notificationCreateSchema, notificationUpdateSchema } from '../validators/notificationSchemas.js';
import { processDueNotificationsForUser } from '../jobs/reminderSweep.js';

export async function registerDevice(req, res) {
  return res.json({ deviceToken: req.body.deviceToken, status: 'registered' });
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
    deviceToken: input.deviceToken,
    aiMessage: input.aiMessage
  });

  return res.status(201).json({ notification });
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
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      status: 'snoozed',
      snoozedUntil: new Date(Date.now() + minutes * 60 * 1000)
    },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function acknowledge(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { status: 'acknowledged' },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification });
}

export async function processDue(req, res) {
  const processed = await processDueNotificationsForUser(req.user._id);
  return res.json({ processed });
}
