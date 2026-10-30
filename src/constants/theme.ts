import type { TopbarTheme } from '@cognite/aura/components/topbar';

import { ThemeMode } from '../enums/themeMode';

export const THEME_STORAGE_KEY = 'asset-passport-theme';
export const DARK_COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
export const DARK_THEME_CLASS_NAME = 'dark';

// Aura's Topbar uses its own light/dark strings; map them at the boundary.
export const TOPBAR_THEME_BY_MODE: Record<ThemeMode, TopbarTheme> = {
  [ThemeMode.LIGHT]: 'light',
  [ThemeMode.DARK]: 'dark',
};

export const THEME_MODE_BY_TOPBAR_THEME: Record<TopbarTheme, ThemeMode> = {
  light: ThemeMode.LIGHT,
  dark: ThemeMode.DARK,
};
