import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  alarmOpen: false,
  activeReminder: null,
  reminderStates: {},
  audio: {
    playingId: null,
    url: ''
  },
  syncReminderStates: (notifications = []) =>
    set((state) => {
      const reminderStates = { ...state.reminderStates };
      for (const notification of notifications) {
        reminderStates[notification._id] = {
          reminderStage: notification.reminderStage || 'first-reminder',
          lastPlayedAudio: notification.lastPlayedAudio || notification.voiceCacheUrl || '',
          reminderTriggered: Boolean(notification.reminderTriggered),
          snoozed: Boolean(notification.snoozed || notification.status === 'snoozed'),
          ignoredCount: notification.ignoredCount || notification.escalationLevel || 0,
          completed: Boolean(notification.completed || notification.status === 'acknowledged' || notification.status === 'cancelled')
        };
      }
      return { reminderStates };
    }),
  openAlarm: (notification = null) => set({ alarmOpen: true, activeReminder: notification }),
  closeAlarm: () => set({ alarmOpen: false, activeReminder: null, audio: { playingId: null, url: '' } }),
  setPlayingAudio: ({ notificationId, url }) => set({ audio: { playingId: notificationId, url } }),
  stopPlayingAudio: () => set({ audio: { playingId: null, url: '' } })
}));
