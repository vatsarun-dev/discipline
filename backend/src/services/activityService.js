import { Activity } from '../models/Activity.js';

export function logActivity({ userId, taskId, type, metadata = {} }) {
  return Activity.create({ userId, taskId, type, metadata });
}
