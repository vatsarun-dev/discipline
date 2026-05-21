import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  alarmOpen: false,
  openAlarm: () => set({ alarmOpen: true }),
  closeAlarm: () => set({ alarmOpen: false })
}));
