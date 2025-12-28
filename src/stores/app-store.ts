/**
 * Application Store
 * Zustand store for managing general app state
 */

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppStore {
  isOnline: boolean;
  theme: ThemeMode;
  language: string;
  setIsOnline: (isOnline: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isOnline: true,
  theme: 'system',
  language: 'en',

  setIsOnline: (isOnline) => set({ isOnline }),

  setTheme: (theme) => set({ theme }),

  setLanguage: (language) => set({ language }),
}));
