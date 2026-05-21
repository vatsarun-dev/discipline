import { create } from 'zustand';

const initialTasks = [
  {
    id: '1',
    title: 'Deep work sprint',
    description: '90 minutes on the highest-leverage project task.',
    category: 'Focus',
    reminderTime: '09:30',
    priority: 'critical',
    aiStrictness: 9,
    completionStatus: 'pending',
    streakCount: 6
  },
  {
    id: '2',
    title: 'Workout',
    description: 'No negotiation. Start with shoes on.',
    category: 'Health',
    reminderTime: '18:00',
    priority: 'high',
    aiStrictness: 7,
    completionStatus: 'pending',
    streakCount: 11
  },
  {
    id: '3',
    title: 'Daily review',
    description: 'Log progress and missed commitments.',
    category: 'Reflection',
    reminderTime: '21:30',
    priority: 'medium',
    aiStrictness: 6,
    completionStatus: 'completed',
    streakCount: 4
  }
];

export const useTaskStore = create((set) => ({
  tasks: initialTasks,
  addTask: (task) =>
    set((state) => ({
      tasks: [
        {
          id: crypto.randomUUID(),
          description: '',
          category: 'General',
          reminderTime: '10:00',
          priority: 'medium',
          aiStrictness: 6,
          completionStatus: 'pending',
          streakCount: 0,
          ...task
        },
        ...state.tasks
      ]
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id)
    })),
  markMissed: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completionStatus: 'missed', streakCount: 0 } : task
      )
    })),
  snoozeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completionStatus: 'snoozed' } : task
      )
    })),
  completeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completionStatus: 'completed', streakCount: task.streakCount + 1 } : task
      )
    }))
}));
