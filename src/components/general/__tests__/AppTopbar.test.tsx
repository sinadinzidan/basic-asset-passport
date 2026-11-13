import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeThemeModeStore } from '../../../__mocks__/themeMode';
import { APP_LOGO_SOURCE } from '../../../constants/branding';
import { UseThemeModeViewModelContext } from '../../../hooks/general/view-models/useThemeModeViewModel';
import { AppTopbar } from '../AppTopbar';

describe(AppTopbar.name, () => {
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const themeModeContext = { themeModeStore: makeThemeModeStore() };

    wrapper = ({ children }) => (
      <UseThemeModeViewModelContext.Provider value={themeModeContext}>
        {children}
      </UseThemeModeViewModelContext.Provider>
    );
  });

  it('has the theme switch on its right side', () => {
    render(<AppTopbar />, { wrapper });

    expect(
      screen
        .getByRole('button', { name: 'Switch to light mode' })
        .closest("[data-slot='topbar-right']"),
    ).toBeInTheDocument();
  });

  it('stays dark in both modes, so the white logo always reads', () => {
    render(<AppTopbar />, { wrapper });

    expect(screen.getByRole('banner')).toHaveClass('dark');
  });

  it('shows the ADNOC Gas logo', () => {
    render(<AppTopbar />, { wrapper });

    expect(screen.getByRole('img', { name: 'ADNOC Gas logo' })).toHaveAttribute(
      'src',
      APP_LOGO_SOURCE,
    );
  });

  it('has no breadcrumb when the page gives it none', () => {
    render(<AppTopbar breadcrumb={null} />, { wrapper });

    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('shows the breadcrumb of the page beside the logo', () => {
    render(<AppTopbar breadcrumb={<span>Assets / Pump</span>} />, { wrapper });

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Assets / Pump',
    );
  });
});
