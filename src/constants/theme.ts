import { ThemeMode } from '../enums/themeMode';

export const DEFAULT_THEME_MODE = ThemeMode.DARK;

export const THEME_MODE_STORAGE_KEY = 'asset-passport:theme-mode';

export const DARK_THEME_CLASS_NAME = 'dark';

export const THEME_MODE_TOGGLE_LABELS: Record<ThemeMode, string> = {
  [ThemeMode.DARK]: 'Switch to light mode',
  [ThemeMode.LIGHT]: 'Switch to dark mode',
};
