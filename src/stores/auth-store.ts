/**
 * Authentication Store
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';
import { User, AuthTokens } from '../types/auth.types';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setAuth: (user, tokens) =>
    set({
      user,
      tokens,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
    }),

  updateTokens: (tokens) =>
    set((state) => ({
      ...state,
      tokens,
    })),
}));
