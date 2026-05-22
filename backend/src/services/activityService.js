import { Activity } from '../models/Activity.js';

export function logActivity({ userId, taskId, type, metadata = {}, delayMinutes = 0, occurredAt }) {
  return Activity.create({ userId, taskId, type, metadata, delayMinutes, occurredAt });
}
