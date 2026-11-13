import { IconMoon, IconSun, type Icon } from '@tabler/icons-react';

import { ThemeMode } from '../../enums/themeMode';
import { useThemeModeViewModel } from '../../hooks/general/view-models/useThemeModeViewModel';

import { IconActionButton } from './IconActionButton';

const THEME_MODE_TOGGLE_ICONS: Record<ThemeMode, Icon> = {
  [ThemeMode.DARK]: IconSun,
  [ThemeMode.LIGHT]: IconMoon,
};

export function ThemeModeToggle() {
  const { themeMode, toggleLabel, toggleThemeMode } = useThemeModeViewModel();

  const ToggleIcon = THEME_MODE_TOGGLE_ICONS[themeMode];

  return (
    <IconActionButton
      label={toggleLabel}
      icon={<ToggleIcon aria-hidden className="size-4" />}
      onClick={toggleThemeMode}
    />
  );
}
