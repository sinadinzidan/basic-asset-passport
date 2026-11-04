import type { TopbarTheme } from '@cognite/aura/components/topbar';
import { createContext, useContext, useEffect, useState } from 'react';

import {
  DARK_COLOR_SCHEME_QUERY,
  THEME_STORAGE_KEY,
} from '../../constants/theme';

export type ThemePreferenceDeps = {
  readStoredTheme: () => string | null;
  writeStoredTheme: (theme: TopbarTheme) => void;
  prefersDarkTheme: () => boolean;
  applyDarkClass: (isDark: boolean) => void;
};

export const defaultThemePreferenceDeps: ThemePreferenceDeps = {
  // Storage can throw (for example when blocked by the browser); the theme then
  // falls back to the system preference and is simply not remembered.
  readStoredTheme: () => {
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  writeStoredTheme: (theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Not remembered across reloads.
    }
  },
  prefersDarkTheme: () => window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches,
  applyDarkClass: (isDark) =>
    document.documentElement.classList.toggle('dark', isDark),
};

export const ThemePreferenceContext = createContext<ThemePreferenceDeps>(
  defaultThemePreferenceDeps,
);

export function resolveInitialTheme(deps: ThemePreferenceDeps): TopbarTheme {
  const storedTheme = deps.readStoredTheme();
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;

  return deps.prefersDarkTheme() ? 'dark' : 'light';
}

export function useThemePreference() {
  const deps = useContext(ThemePreferenceContext);

  const [theme, setTheme] = useState<TopbarTheme>(() =>
    resolveInitialTheme(deps),
  );

  useEffect(() => {
    deps.applyDarkClass(theme === 'dark');
    deps.writeStoredTheme(theme);
  }, [deps, theme]);

  return { theme, setTheme };
}
