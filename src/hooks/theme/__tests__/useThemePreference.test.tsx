import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  defaultThemePreferenceDeps,
  resolveInitialTheme,
  ThemePreferenceContext,
  type ThemePreferenceDeps,
  useThemePreference,
} from '../useThemePreference';

function makeDeps(
  overrides: Partial<ThemePreferenceDeps> = {},
): ThemePreferenceDeps {
  return {
    readStoredTheme: vi.fn(() => null),
    writeStoredTheme: vi.fn(),
    prefersDarkTheme: vi.fn(() => false),
    applyDarkClass: vi.fn(),
    ...overrides,
  };
}

describe(resolveInitialTheme.name, () => {
  it.each(['light', 'dark'] as const)('uses the stored %s theme', (theme) => {
    const deps = makeDeps({ readStoredTheme: vi.fn(() => theme) });

    expect(resolveInitialTheme(deps)).toBe(theme);
  });

  it('ignores an unrecognised stored value', () => {
    const deps = makeDeps({
      readStoredTheme: vi.fn(() => 'sepia'),
      prefersDarkTheme: vi.fn(() => true),
    });

    expect(resolveInitialTheme(deps)).toBe('dark');
  });

  it.each([
    [true, 'dark'],
    [false, 'light'],
  ] as const)(
    'follows the system when nothing is stored (dark=%s)',
    (prefersDark, theme) => {
      const deps = makeDeps({ prefersDarkTheme: vi.fn(() => prefersDark) });

      expect(resolveInitialTheme(deps)).toBe(theme);
    },
  );
});

describe(useThemePreference.name, () => {
  let deps: ThemePreferenceDeps;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    deps = makeDeps();
    wrapper = ({ children }) => (
      <ThemePreferenceContext.Provider value={deps}>
        {children}
      </ThemePreferenceContext.Provider>
    );
  });

  it('applies and stores the initial theme', () => {
    vi.mocked(deps.prefersDarkTheme).mockReturnValue(true);

    const { result } = renderHook(() => useThemePreference(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(deps.applyDarkClass).toHaveBeenLastCalledWith(true);
    expect(deps.writeStoredTheme).toHaveBeenLastCalledWith('dark');
  });

  it('applies and stores a theme chosen by the user', () => {
    const { result } = renderHook(() => useThemePreference(), { wrapper });

    act(() => result.current.setTheme('dark'));

    expect(result.current.theme).toBe('dark');
    expect(deps.applyDarkClass).toHaveBeenLastCalledWith(true);
    expect(deps.writeStoredTheme).toHaveBeenLastCalledWith('dark');
  });
});

describe('defaultThemePreferenceDeps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('round-trips the theme through local storage', () => {
    defaultThemePreferenceDeps.writeStoredTheme('dark');

    expect(defaultThemePreferenceDeps.readStoredTheme()).toBe('dark');
  });

  it('toggles the dark class on the document', () => {
    defaultThemePreferenceDeps.applyDarkClass(true);
    expect(document.documentElement).toHaveClass('dark');

    defaultThemePreferenceDeps.applyDarkClass(false);
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('reads the system preference from the color scheme media query', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as Partial<MediaQueryList> as MediaQueryList);

    expect(defaultThemePreferenceDeps.prefersDarkTheme()).toBe(true);
  });

  it('treats unavailable storage as nothing stored', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(defaultThemePreferenceDeps.readStoredTheme()).toBeNull();
  });

  it('does not fail when storage rejects a write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() =>
      defaultThemePreferenceDeps.writeStoredTheme('dark'),
    ).not.toThrow();
  });
});
