import { describe, expect, it, vi } from 'vitest';

import { DARK_THEME_CLASS_NAME, THEME_MODE_STORAGE_KEY } from '../../../constants/theme';
import { ThemeMode } from '../../../enums/themeMode';
import { makeThemeModeStorage } from '../../../mocks/themeMode';
import type { ThemeModeStorage } from '../../../types/theme';
import { createThemeModeStore } from '../themeModeStore';

describe(createThemeModeStore.name, () => {
  it('starts dark when no choice has been saved', () => {
    const { store, rootElement } = setup();

    expect(store.getThemeMode()).toBe(ThemeMode.DARK);
    expect(rootElement).toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('starts in the saved mode', () => {
    const { store, rootElement } = setup({
      storage: makeThemeModeStorage(ThemeMode.LIGHT),
    });

    expect(store.getThemeMode()).toBe(ThemeMode.LIGHT);
    expect(rootElement).not.toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('starts dark when the saved value is not a theme mode', () => {
    const { store } = setup({ storage: makeThemeModeStorage('sepia') });

    expect(store.getThemeMode()).toBe(ThemeMode.DARK);
  });

  it('starts dark when the storage cannot be reached', () => {
    const { store, rootElement } = setup({
      getStorage: () => {
        throw new Error('Storage is blocked');
      },
    });

    expect(store.getThemeMode()).toBe(ThemeMode.DARK);
    expect(rootElement).toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('takes the dark class off the root element in light mode and puts it back in dark mode', () => {
    const { store, rootElement } = setup();

    store.setThemeMode(ThemeMode.LIGHT);
    expect(rootElement).not.toHaveClass(DARK_THEME_CLASS_NAME);

    store.setThemeMode(ThemeMode.DARK);
    expect(rootElement).toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('saves the chosen mode', () => {
    const storage = makeThemeModeStorage();
    const { store } = setup({ storage });

    store.setThemeMode(ThemeMode.LIGHT);

    expect(storage.getItem(THEME_MODE_STORAGE_KEY)).toBe(ThemeMode.LIGHT);
  });

  it('still changes the mode when the choice cannot be saved', () => {
    const storage: ThemeModeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage is full');
      },
    };
    const { store, rootElement } = setup({ storage });

    store.setThemeMode(ThemeMode.LIGHT);

    expect(store.getThemeMode()).toBe(ThemeMode.LIGHT);
    expect(rootElement).not.toHaveClass(DARK_THEME_CLASS_NAME);
  });

  it('tells its subscribers when the mode changes', () => {
    const { store } = setup();
    const onChange = vi.fn();
    store.subscribe(onChange);

    store.setThemeMode(ThemeMode.LIGHT);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not tell its subscribers when the mode is set to what it already is', () => {
    const { store } = setup();
    const onChange = vi.fn();
    store.subscribe(onChange);

    store.setThemeMode(ThemeMode.DARK);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('stops telling a subscriber that has unsubscribed', () => {
    const { store } = setup();
    const onChange = vi.fn();
    const unsubscribe = store.subscribe(onChange);

    unsubscribe();
    store.setThemeMode(ThemeMode.LIGHT);

    expect(onChange).not.toHaveBeenCalled();
  });
});

type SetupOptions = {
  storage?: ThemeModeStorage;
  getStorage?: () => ThemeModeStorage;
};

function setup({ storage, getStorage }: SetupOptions = {}) {
  const rootElement = document.createElement('html');
  const usedStorage = storage ?? makeThemeModeStorage();
  const store = createThemeModeStore(getStorage ?? (() => usedStorage), rootElement);

  return { store, rootElement };
}
