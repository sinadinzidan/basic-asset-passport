import {
  DARK_THEME_CLASS_NAME,
  DEFAULT_THEME_MODE,
  THEME_MODE_STORAGE_KEY,
} from '../../constants/theme';
import { ThemeMode } from '../../enums/themeMode';
import type { ThemeModeStorage, ThemeModeStore } from '../../types/theme';

const THEME_MODES: ReadonlySet<string> = new Set(Object.values(ThemeMode));

export function createThemeModeStore(
  getStorage: () => ThemeModeStorage,
  rootElement: Element,
): ThemeModeStore {
  const listeners = new Set<() => void>();
  let currentThemeMode = readSavedThemeMode(getStorage) ?? DEFAULT_THEME_MODE;

  applyThemeMode(rootElement, currentThemeMode);

  return {
    getThemeMode: () => currentThemeMode,
    setThemeMode: (themeMode: ThemeMode) => {
      if (themeMode === currentThemeMode) return;

      currentThemeMode = themeMode;
      applyThemeMode(rootElement, themeMode);
      saveThemeMode(getStorage, themeMode);
      listeners.forEach((onChange) => onChange());
    },
    subscribe: (onChange: () => void) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
  };
}

function applyThemeMode(rootElement: Element, themeMode: ThemeMode): void {
  rootElement.classList.toggle(DARK_THEME_CLASS_NAME, themeMode === ThemeMode.DARK);
}

function readSavedThemeMode(getStorage: () => ThemeModeStorage): ThemeMode | null {
  try {
    const savedValue = getStorage().getItem(THEME_MODE_STORAGE_KEY);
    return isThemeMode(savedValue) ? savedValue : null;
  } catch {
    return null;
  }
}

function saveThemeMode(getStorage: () => ThemeModeStorage, themeMode: ThemeMode): boolean {
  try {
    getStorage().setItem(THEME_MODE_STORAGE_KEY, themeMode);
    return true;
  } catch {
    return false;
  }
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && THEME_MODES.has(value);
}
