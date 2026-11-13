import {
  DARK_THEME_CLASS_NAME,
  DEFAULT_THEME_MODE,
  THEME_MODE_STORAGE_KEY,
} from '../../constants/theme';
import { ThemeMode } from '../../enums/themeMode';
import type { ThemeModeStorage, ThemeModeStore } from '../../types/theme';

const THEME_MODES: ReadonlySet<string> = new Set(Object.values(ThemeMode));

class BrowserThemeModeStore implements ThemeModeStore {
  private readonly listeners = new Set<() => void>();

  private currentThemeMode: ThemeMode;

  constructor(
    private readonly getStorage: () => ThemeModeStorage,
    private readonly rootElement: Element,
  ) {
    this.currentThemeMode = readSavedThemeMode(getStorage) ?? DEFAULT_THEME_MODE;
    applyThemeMode(rootElement, this.currentThemeMode);
  }

  getThemeMode = (): ThemeMode => this.currentThemeMode;

  setThemeMode = (themeMode: ThemeMode): void => {
    if (themeMode === this.currentThemeMode) return;

    this.currentThemeMode = themeMode;
    applyThemeMode(this.rootElement, themeMode);
    saveThemeMode(this.getStorage, themeMode);
    this.listeners.forEach((onChange) => onChange());
  };

  subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);

    return () => {
      this.listeners.delete(onChange);
    };
  };
}

export function createThemeModeStore(
  getStorage: () => ThemeModeStorage,
  rootElement: Element,
): ThemeModeStore {
  return new BrowserThemeModeStore(getStorage, rootElement);
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
