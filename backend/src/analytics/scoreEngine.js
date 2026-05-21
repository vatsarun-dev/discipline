export function calculateDisciplineScore({ totalTasks = 0, completedTasks = 0, missedTasks = 0, snoozes = 0 }) {
  if (totalTasks === 0) {
    return 0;
  }

  const completionRatio = completedTasks / totalTasks;
  const missPenalty = Math.min(missedTasks * 7, 35);
  const snoozePenalty = Math.min(snoozes * 2, 15);
  return Math.max(0, Math.round(completionRatio * 100 - missPenalty - snoozePenalty));
}

export function calculateLazinessScore({ disciplineScore, delayedCompletions = 0, wakeFailures = 0 }) {
  const drag = delayedCompletions * 4 + wakeFailures * 8;
  return Math.min(100, Math.max(0, 100 - disciplineScore + drag));
}
