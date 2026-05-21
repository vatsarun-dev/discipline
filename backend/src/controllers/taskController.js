import { Task } from '../models/Task.js';
import { logActivity } from '../services/activityService.js';
import { taskCreateSchema, taskUpdateSchema } from '../validators/taskSchemas.js';

export async function listTasks(req, res) {
  const tasks = await Task.find({ userId: req.user._id }).sort({ reminderTime: 1, createdAt: -1 });
  return res.json({ tasks });
}

export async function createTask(req, res) {
  const input = taskCreateSchema.parse(req.body);
  const task = await Task.create({ ...input, userId: req.user._id });
  return res.status(201).json({ task });
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
  await logActivity({
    userId: req.user._id,
    taskId: task._id,
    type: 'task_delayed',
    metadata: { update: input }
  });
  return res.json({ task });
}

export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await logActivity({ userId: req.user._id, taskId: task._id, type: 'task_delayed', metadata: { deleted: true } });
  return res.status(204).send();
}

export async function completeTask(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    {
      $set: {
        completionStatus: 'completed',
        completedAt: new Date()
      },
      $inc: { streakCount: 1 }
    },
    { new: true }
  );

  if (!task) return res.status(404).json({ message: 'Task not found' });
  const delayMinutes = task.reminderTime ? Math.max(0, Math.round((Date.now() - task.reminderTime.getTime()) / 60000)) : 0;
  await logActivity({
    userId: req.user._id,
    taskId: task._id,
    type: 'task_completed',
    delayMinutes,
    metadata: { completedAt: task.completedAt }
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
  await logActivity({ userId: req.user._id, taskId: task._id, type: 'task_missed' });
  return res.json({ task });
}
