import { Activity } from '../models/Activity.js';
import { activityCreateSchema, activityUpdateSchema } from '../validators/activitySchemas.js';

export async function listActivities(req, res) {
  const activities = await Activity.find({ userId: req.user._id })
    .populate('taskId', 'title category priority')
    .sort({ occurredAt: -1 })
    .limit(Number(req.query.limit || 100));
  return res.json({ activities });
}

export async function createActivity(req, res) {
  const input = activityCreateSchema.parse(req.body);
  const activity = await Activity.create({ ...input, userId: req.user._id });
  return res.status(201).json({ activity });
}

export async function updateActivity(req, res) {
  const input = activityUpdateSchema.parse(req.body);
  const activity = await Activity.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, input, {
    new: true,
    runValidators: true
  });

  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  return res.json({ activity });
}

export async function deleteActivity(req, res) {
  const activity = await Activity.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!activity) return res.status(404).json({ message: 'Activity not found' });
  return res.status(204).send();
}
