import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './colors';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: isDark ? darkColors : lightColors, isDark }),
    [isDark]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active palette - swaps automatically with the system light/dark setting. */
export function useTheme(): ThemeColors {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.colors;
}

/** Whether the system is currently in dark mode - for the rare case a component needs the flag, not just the palette. */
export function useIsDarkMode(): boolean {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useIsDarkMode must be used within a ThemeProvider');
  }
  return ctx.isDark;
}
