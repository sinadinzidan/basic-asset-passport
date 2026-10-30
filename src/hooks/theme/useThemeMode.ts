import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { THEME_MODE_STORED_VALUES } from '../../constants/persistence';
import { DARK_COLOR_SCHEME_QUERY, DARK_THEME_CLASS_NAME, THEME_STORAGE_KEY } from '../../constants/theme';
import { ThemeMode } from '../../enums/themeMode';
import { fromStoredValue } from '../../lib/enumGuards';

function readStoredTheme(): ThemeMode | undefined {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return fromStoredValue(ThemeMode, THEME_MODE_STORED_VALUES, stored);
  } catch {
    return undefined;
  }
}

function storeTheme(theme: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, THEME_MODE_STORED_VALUES[theme]);
  } catch {
    // Storage can be blocked in embedded or private contexts; the choice still applies for this session.
  }
}

function prefersDarkMode(): boolean {
  return window.matchMedia?.(DARK_COLOR_SCHEME_QUERY).matches ?? false;
}

function applyTheme(theme: ThemeMode): void {
  document.documentElement.classList.toggle(DARK_THEME_CLASS_NAME, theme === ThemeMode.DARK);
}

const defaultDeps = { readStoredTheme, storeTheme, prefersDarkMode, applyTheme };
export type ThemeModeContextType = typeof defaultDeps;
export const ThemeModeContext = createContext<ThemeModeContextType>(defaultDeps);

export { defaultDeps as defaultThemeModeDeps };

export function useThemeMode(): { theme: ThemeMode; setTheme: (theme: ThemeMode) => void } {
  const { readStoredTheme, storeTheme, prefersDarkMode, applyTheme } = useContext(ThemeModeContext);

  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme() ?? (prefersDarkMode() ? ThemeMode.DARK : ThemeMode.LIGHT));

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    storeTheme(next);
  }, [storeTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [applyTheme, theme]);

  return { theme, setTheme };
}
