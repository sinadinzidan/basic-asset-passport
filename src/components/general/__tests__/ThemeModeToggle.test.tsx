import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { makeThemeModeStore } from '../../../__mocks__/themeMode';
import { ThemeMode } from '../../../enums/themeMode';
import { UseThemeModeViewModelContext } from '../../../hooks/general/useThemeModeViewModel';
import type { ThemeModeStore } from '../../../types/theme';
import { ThemeModeToggle } from '../ThemeModeToggle';

describe(ThemeModeToggle.name, () => {
  it('offers light mode while the app is dark', () => {
    renderToggle(makeThemeModeStore(ThemeMode.DARK));

    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  });

  it('offers dark mode while the app is light', () => {
    renderToggle(makeThemeModeStore(ThemeMode.LIGHT));

    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  });

  it('switches the mode when pressed, and then offers the way back', async () => {
    const user = userEvent.setup();
    const themeModeStore = makeThemeModeStore(ThemeMode.DARK);

    renderToggle(themeModeStore);

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));

    expect(themeModeStore.getThemeMode()).toBe(ThemeMode.LIGHT);
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  });

  it('shows the icon of the mode it switches to', async () => {
    const user = userEvent.setup();

    renderToggle(makeThemeModeStore(ThemeMode.DARK));
    const button = screen.getByRole('button', { name: 'Switch to light mode' });

    expect(button.querySelector('.tabler-icon-sun')).not.toBeNull();

    await user.click(button);

    expect(
      screen
        .getByRole('button', { name: 'Switch to dark mode' })
        .querySelector('.tabler-icon-moon'),
    ).not.toBeNull();
  });
});

function renderToggle(themeModeStore: ThemeModeStore) {
  return render(
    <UseThemeModeViewModelContext.Provider value={{ themeModeStore }}>
      <ThemeModeToggle />
    </UseThemeModeViewModelContext.Provider>,
  );
}
