import { create } from 'zustand';

export const useAnalyticsStore = create(() => ({
  summary: {
    disciplineScore: 84,
    lazinessScore: 18,
    consistencyPercentage: 78,
    completedTasks: 9,
    missedTasks: 2
  },
  weekly: [
    { day: 'Mon', completed: 8, missed: 1 },
    { day: 'Tue', completed: 7, missed: 2 },
    { day: 'Wed', completed: 10, missed: 0 },
    { day: 'Thu', completed: 6, missed: 2 },
    { day: 'Fri', completed: 9, missed: 1 },
    { day: 'Sat', completed: 5, missed: 3 },
    { day: 'Sun', completed: 8, missed: 1 }
  ],
  heatmap: Array.from({ length: 96 }).map((_, index) => ({
    date: `2026-05-${String((index % 21) + 1).padStart(2, '0')}`,
    count: (index * 7) % 5
  }))
}));
