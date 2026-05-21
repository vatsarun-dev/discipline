import { create } from 'zustand';

export const useAiStore = create(() => ({
  coachMessage:
    'You said 9:30 was your focus window. That window is here. Do the first ten minutes before your mind starts negotiating against you.',
  personality: 'Military Coach',
  waveform: [18, 34, 22, 48, 30, 54, 26, 42, 20, 36, 28, 50]
}));
