import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DARK_THEME_CLASS_NAME, THEME_STORAGE_KEY } from '../../../constants/theme';
import { ThemeMode } from '../../../enums/themeMode';
import { defaultThemeModeDeps, ThemeModeContext, useThemeMode } from '../useThemeMode';
import type { ThemeModeContextType } from '../useThemeMode';

describe('useThemeMode', () => {
  let mockContext: ThemeModeContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      readStoredTheme: vi.fn(() => undefined),
      storeTheme: vi.fn(),
      prefersDarkMode: vi.fn(() => false),
      applyTheme: vi.fn(),
    };
    wrapper = ({ children }) => <ThemeModeContext.Provider value={mockContext}>{children}</ThemeModeContext.Provider>;
  });

  it('follows the system preference when nothing is stored', () => {
    vi.mocked(mockContext.prefersDarkMode).mockReturnValue(true);
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.theme).toBe(ThemeMode.DARK);
    expect(mockContext.applyTheme).toHaveBeenCalledWith(ThemeMode.DARK);
  });

  it('prefers a stored choice over the system preference', () => {
    vi.mocked(mockContext.prefersDarkMode).mockReturnValue(true);
    vi.mocked(mockContext.readStoredTheme).mockReturnValue(ThemeMode.LIGHT);
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.theme).toBe(ThemeMode.LIGHT);
    expect(mockContext.applyTheme).toHaveBeenCalledWith(ThemeMode.LIGHT);
  });

  it('applies and stores a new choice', () => {
    const { result } = renderHook(() => useThemeMode(), { wrapper });
    act(() => result.current.setTheme(ThemeMode.DARK));
    expect(result.current.theme).toBe(ThemeMode.DARK);
    expect(mockContext.storeTheme).toHaveBeenCalledWith(ThemeMode.DARK);
    expect(mockContext.applyTheme).toHaveBeenLastCalledWith(ThemeMode.DARK);
  });
});

describe('default theme dependencies', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove(DARK_THEME_CLASS_NAME);
  });
  afterEach(() => vi.restoreAllMocks());

  it('stores and reads a valid theme and ignores an unknown stored value', () => {
    defaultThemeModeDeps.storeTheme(ThemeMode.DARK);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(defaultThemeModeDeps.readStoredTheme()).toBe(ThemeMode.DARK);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(defaultThemeModeDeps.readStoredTheme()).toBe(ThemeMode.LIGHT);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'DARK');
    expect(defaultThemeModeDeps.readStoredTheme()).toBeUndefined();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(defaultThemeModeDeps.readStoredTheme()).toBeUndefined();
  });

  it('survives blocked storage', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => defaultThemeModeDeps.storeTheme(ThemeMode.DARK)).not.toThrow();
    expect(defaultThemeModeDeps.readStoredTheme()).toBeUndefined();
  });

  it('toggles the dark class on the document', () => {
    defaultThemeModeDeps.applyTheme(ThemeMode.DARK);
    expect(document.documentElement).toHaveClass(DARK_THEME_CLASS_NAME);
    defaultThemeModeDeps.applyTheme(ThemeMode.LIGHT);
    expect(document.documentElement).not.toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('reads the system preference', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    expect(defaultThemeModeDeps.prefersDarkMode()).toBe(true);
    vi.unstubAllGlobals();
  });
});
