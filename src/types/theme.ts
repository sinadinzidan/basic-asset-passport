import type { ThemeMode } from '../enums/themeMode';

export type ThemeModeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type ThemeModeStore = {
  getThemeMode: () => ThemeMode;
  setThemeMode: (themeMode: ThemeMode) => void;
  subscribe: (onChange: () => void) => () => void;
};
