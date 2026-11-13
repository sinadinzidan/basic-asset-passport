import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

import { THEME_MODE_TOGGLE_LABELS } from '../../../constants/theme';
import { ThemeMode } from '../../../enums/themeMode';
import { createThemeModeStore } from '../../../services/theme/themeModeStore';
import type { ThemeModeStore } from '../../../types/theme';

const defaultDeps: { themeModeStore: ThemeModeStore } = {
  themeModeStore: createThemeModeStore(() => window.localStorage, document.documentElement),
};

type UseThemeModeViewModelContextType = typeof defaultDeps;
export const UseThemeModeViewModelContext =
  createContext<UseThemeModeViewModelContextType>(defaultDeps);

type ThemeModeViewModel = {
  themeMode: ThemeMode;
  toggleLabel: string;
  toggleThemeMode: () => void;
};

export function useThemeModeViewModel(): ThemeModeViewModel {
  const { themeModeStore } = useContext(UseThemeModeViewModelContext);
  const themeMode = useSyncExternalStore(themeModeStore.subscribe, themeModeStore.getThemeMode);

  const toggleThemeMode = useCallback(() => {
    themeModeStore.setThemeMode(themeMode === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK);
  }, [themeMode, themeModeStore]);

  return {
    themeMode,
    toggleLabel: THEME_MODE_TOGGLE_LABELS[themeMode],
    toggleThemeMode,
  };
}
