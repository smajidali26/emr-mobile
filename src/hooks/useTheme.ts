/**
 * useTheme Hook
 * Hook for managing app theme (light/dark/auto)
 */

import { useColorScheme } from 'react-native';
import { useAppStore } from '@stores/app-store';

export type Theme = 'light' | 'dark';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme: themePreference, setTheme } = useAppStore();

  const getActiveTheme = (): Theme => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themePreference as Theme;
  };

  const activeTheme = getActiveTheme();
  const isDark = activeTheme === 'dark';

  return {
    theme: activeTheme,
    isDark,
    themePreference,
    setTheme,
  };
};
