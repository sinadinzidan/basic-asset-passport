import { THEME_MODE_STORAGE_KEY } from '../constants/theme';
import type { ThemeMode } from '../enums/themeMode';
import { createThemeModeStore } from '../services/theme/themeModeStore';
import type { ThemeModeStorage, ThemeModeStore } from '../types/theme';

export function makeThemeModeStorage(savedValue?: string): ThemeModeStorage {
  const values = new Map<string, string>();

  if (savedValue !== undefined) values.set(THEME_MODE_STORAGE_KEY, savedValue);

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

export function makeThemeModeStore(savedThemeMode?: ThemeMode): ThemeModeStore {
  const storage = makeThemeModeStorage(savedThemeMode);

  return createThemeModeStore(() => storage, document.createElement('html'));
}
