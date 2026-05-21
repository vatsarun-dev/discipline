import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: {
    name: 'Arun',
    email: 'arun@example.com',
    onboarding: {
      strictnessLevel: 8,
      preferredAiPersonality: 'Military Coach'
    }
  },
  token: null,
  setSession: ({ user, token }) => set({ user, token })
}));
