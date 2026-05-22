import { AIPersonality } from '../models/AIPersonality.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { defaultPersonalities } from '../ai/defaultPersonalities.js';
import { generateCoachingResponse } from '../services/aiService.js';
import { personalityCreateSchema, personalityUpdateSchema } from '../validators/personalitySchemas.js';

export async function listPersonalities(req, res) {
  const custom = await AIPersonality.find({ userId: req.user._id });
  return res.json({ personalities: [...defaultPersonalities.map((item) => ({ ...item, isDefault: true })), ...custom] });
}

export async function createPersonality(req, res) {
  const input = personalityCreateSchema.parse(req.body);
  const personality = await AIPersonality.create({ ...input, userId: req.user._id, isDefault: false });
  return res.status(201).json({ personality });
}

export async function updatePersonality(req, res) {
  const input = personalityUpdateSchema.parse(req.body);
  const personality = await AIPersonality.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    input,
    { new: true, runValidators: true }
  );

  if (!personality) return res.status(404).json({ message: 'Personality not found' });
  return res.json({ personality });
}

export async function deletePersonality(req, res) {
  const personality = await AIPersonality.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!personality) return res.status(404).json({ message: 'Personality not found' });
  return res.status(204).send();
}

export async function coach(req, res) {
  const task = req.body.taskId ? await Task.findOne({ _id: req.body.taskId, userId: req.user._id }) : null;
  const behavior = req.body.behavior || await buildBehaviorContext(req.user._id, task);
  const response = await generateCoachingResponse({
    user: req.user,
    task,
    personality: req.body.personality,
    behavior
  });

  return res.json({ response });
}

async function buildBehaviorContext(userId, task) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [weeklyActivities, dailyActivities] = await Promise.all([
    Activity.find({ userId, occurredAt: { $gte: weekAgo } }).sort({ occurredAt: -1 }).limit(120),
    Activity.find({ userId, occurredAt: { $gte: dayAgo } }).sort({ occurredAt: -1 }).limit(60)
  ]);

  return {
    delayMinutes: task?.reminderTime ? Math.max(0, Math.round((Date.now() - task.reminderTime.getTime()) / 60000)) : 0,
    missedTasksThisWeek: weeklyActivities.filter((activity) => activity.type === 'task_missed').length,
    delayedCompletionsToday: dailyActivities.filter((activity) => activity.delayMinutes > 0 || activity.type === 'snoozed').length,
    wakeFailuresThisWeek: weeklyActivities.filter((activity) => activity.type === 'wake_failed').length,
    recentCompletions: weeklyActivities.filter((activity) => activity.type === 'task_completed').length,
    taskStreak: task?.streakCount || 0,
    lastMissedAt: task?.lastMissedAt,
    repeatedExcuses: weeklyActivities
      .filter((activity) => activity.type === 'excuse_logged' && activity.metadata?.excuse)
      .map((activity) => activity.metadata.excuse)
      .slice(0, 4)
  };
}
