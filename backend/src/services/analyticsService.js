import { Activity } from '../models/Activity.js';
import { Task } from '../models/Task.js';
import { calculateDisciplineScore, calculateLazinessScore } from '../analytics/scoreEngine.js';

export async function getDashboardSummary(userId) {
  const [tasks, recentActivities] = await Promise.all([
    Task.find({ userId }).sort({ reminderTime: 1, createdAt: -1 }),
    Activity.find({ userId }).sort({ occurredAt: -1 }).limit(300)
  ]);

  const completedTasks = tasks.filter((task) => task.completionStatus === 'completed').length;
  const missedTasks = tasks.filter((task) => task.completionStatus === 'missed').length;
  const pendingTasks = tasks.filter((task) => task.completionStatus === 'pending').length;
  const snoozes = recentActivities.filter((activity) => activity.type === 'snoozed').length;
  const delayedCompletions = recentActivities.filter((activity) => activity.type === 'task_delayed').length;
  const wakeFailures = recentActivities.filter((activity) => activity.type === 'wake_failed').length;
  const longestStreak = tasks.reduce((max, task) => Math.max(max, task.streakCount || 0), 0);
  const activeHours = calculateActiveHours(recentActivities);
  const disciplineScore = calculateDisciplineScore({
    totalTasks: tasks.length,
    completedTasks,
    missedTasks,
    snoozes
  });

  return {
    totalTasks: tasks.length,
    completedTasks,
    missedTasks,
    pendingTasks,
    snoozedTasks: tasks.filter((task) => task.completionStatus === 'snoozed').length,
    longestStreak,
    disciplineScore,
    lazinessScore: calculateLazinessScore({ disciplineScore, delayedCompletions, wakeFailures }),
    consistencyPercentage: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    activeHours,
    delayedCompletions,
    wakeFailures,
    upcomingTasks: tasks.filter((task) => task.completionStatus !== 'completed').slice(0, 6),
    insights: buildInsights({ missedTasks, snoozes, delayedCompletions, wakeFailures })
  };
}

export async function getWeeklyTrends(userId) {
  const start = startOfDay(daysAgo(6));
  const activities = await Activity.find({ userId, occurredAt: { $gte: start } }).sort({ occurredAt: 1 });
  return Array.from({ length: 7 }).map((_, index) => {
    const date = startOfDay(daysAgo(6 - index));
    const key = date.toISOString().slice(0, 10);
    const dayActivities = activities.filter((activity) => activity.occurredAt.toISOString().slice(0, 10) === key);
    const completed = dayActivities.filter((activity) => activity.type === 'task_completed').length;
    const missed = dayActivities.filter((activity) => activity.type === 'task_missed').length;
    const delayed = dayActivities.filter((activity) => activity.type === 'task_delayed').length;

    return {
      date: key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      completed,
      missed,
      delayed,
      score: calculateDisciplineScore({ totalTasks: completed + missed + delayed, completedTasks: completed, missedTasks: missed, snoozes: 0 })
    };
  });
}

export async function getHeatmap(userId) {
  const start = startOfDay(daysAgo(364));
  const activities = await Activity.find({
    userId,
    type: { $in: ['task_completed', 'task_missed'] },
    occurredAt: { $gte: start }
  });

  const counts = new Map();
  for (const activity of activities) {
    const key = activity.occurredAt.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + (activity.type === 'task_completed' ? 1 : 0));
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

function buildInsights({ missedTasks, snoozes, delayedCompletions, wakeFailures }) {
  const insights = [];
  if (missedTasks > 0) insights.push(`${missedTasks} active commitments are currently marked missed.`);
  if (snoozes > 2) insights.push('Snooze behavior is rising; reminders may need stricter escalation.');
  if (delayedCompletions > 0) insights.push('Delayed completions suggest resistance during planned focus windows.');
  if (wakeFailures > 0) insights.push('Wake consistency is a priority coaching target.');
  return insights.length ? insights : ['Consistency is stable. Protect the current routine.'];
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function calculateActiveHours(activities) {
  const hours = Array.from({ length: 24 }).map((_, hour) => ({ hour, count: 0 }));
  for (const activity of activities) {
    hours[activity.occurredAt.getHours()].count += 1;
  }
  return hours.filter((item) => item.count > 0);
}
