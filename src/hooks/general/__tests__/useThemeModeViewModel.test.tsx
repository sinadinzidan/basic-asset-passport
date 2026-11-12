import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeThemeModeStore } from '../../../__mocks__/themeMode';
import { ThemeMode } from '../../../enums/themeMode';
import type { ThemeModeStore } from '../../../types/theme';
import { UseThemeModeViewModelContext, useThemeModeViewModel } from '../useThemeModeViewModel';

describe(useThemeModeViewModel.name, () => {
  let themeModeStore: ThemeModeStore;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    themeModeStore = makeThemeModeStore();
    wrapper = ({ children }) => (
      <UseThemeModeViewModelContext.Provider value={{ themeModeStore }}>
        {children}
      </UseThemeModeViewModelContext.Provider>
    );
  });

  it('reports the mode the store is in', () => {
    const { result } = renderHook(() => useThemeModeViewModel(), { wrapper });

    expect(result.current.themeMode).toBe(ThemeMode.DARK);
  });

  it('offers light mode while dark, and dark mode while light', () => {
    const { result } = renderHook(() => useThemeModeViewModel(), { wrapper });
    expect(result.current.toggleLabel).toBe('Switch to light mode');

    act(() => result.current.toggleThemeMode());

    expect(result.current.toggleLabel).toBe('Switch to dark mode');
  });

  it('switches the store to the other mode and back', () => {
    const { result } = renderHook(() => useThemeModeViewModel(), { wrapper });

    act(() => result.current.toggleThemeMode());
    expect(themeModeStore.getThemeMode()).toBe(ThemeMode.LIGHT);
    expect(result.current.themeMode).toBe(ThemeMode.LIGHT);

    act(() => result.current.toggleThemeMode());
    expect(themeModeStore.getThemeMode()).toBe(ThemeMode.DARK);
    expect(result.current.themeMode).toBe(ThemeMode.DARK);
  });

  it('follows a change made elsewhere, so every switch on the page agrees', () => {
    const { result } = renderHook(() => useThemeModeViewModel(), { wrapper });

    act(() => themeModeStore.setThemeMode(ThemeMode.LIGHT));

    expect(result.current.themeMode).toBe(ThemeMode.LIGHT);
  });
});
