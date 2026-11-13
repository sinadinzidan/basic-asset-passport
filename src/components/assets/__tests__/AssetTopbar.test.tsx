import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { makeThemeModeStore } from '../../../__mocks__/themeMode';
import { APP_LOGO_SOURCE } from '../../../constants/branding';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { UseAssetDetailsContext } from '../../../hooks/assets/useAssetDetails';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { UseThemeModeViewModelContext } from '../../../hooks/general/view-models/useThemeModeViewModel';
import type { AssetDetailsService } from '../../../services/assets/assetDetails';
import type { NavigationStore } from '../../../types/navigation';
import { AssetTopbar } from '../AssetTopbar';

const assetContext = makeMockClient();

const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

describe(AssetTopbar.name, () => {
  let mockContext: AssetDetailsService;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore();
    mockContext = {
      getAssetDetails: vi.fn(() => Promise.resolve(makeInstanceDetails())),
    };
    const QueryWrapper = makeQueryClientWrapper();
    const themeModeContext = { themeModeStore: makeThemeModeStore() };

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseThemeModeViewModelContext.Provider value={themeModeContext}>
          <UseAssetDetailsContext.Provider value={{ createAssetDetailsService: () => mockContext }}>
            <QueryWrapper>
              <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
            </QueryWrapper>
          </UseAssetDetailsContext.Provider>
        </UseThemeModeViewModelContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('has the theme switch on its right side', () => {
    render(<AssetTopbar />, { wrapper });

    expect(
      screen
        .getByRole('button', { name: 'Switch to light mode' })
        .closest("[data-slot='topbar-right']"),
    ).toBeInTheDocument();
  });

  it('stays dark in both modes, so the white logo always reads', () => {
    render(<AssetTopbar />, { wrapper });

    expect(screen.getByRole('banner')).toHaveClass('dark');
  });

  it('shows the ADNOC Gas logo', () => {
    render(<AssetTopbar />, { wrapper });

    expect(screen.getByRole('img', { name: 'ADNOC Gas logo' })).toHaveAttribute(
      'src',
      APP_LOGO_SOURCE,
    );
  });

  it('has no breadcrumb until an asset is selected', () => {
    render(<AssetTopbar />, { wrapper });

    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('shows the way to the open asset: the register as a link, then the asset as the current page', async () => {
    renderWithSelectedAsset();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const items = within(breadcrumb).getAllByRole('listitem');

    expect(within(items[0]).getByRole('button', { name: 'Assets' })).toBeInTheDocument();
    expect(await within(breadcrumb).findByText('Cooling Water Pump')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('goes back to the register from the first step of the breadcrumb', async () => {
    const user = userEvent.setup();

    renderWithSelectedAsset();

    await user.click(screen.getByRole('button', { name: 'Assets' }));

    expect(store.getState().navigationState.selectedAsset).toBeNull();
    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('does not make the current page something to click', () => {
    renderWithSelectedAsset();

    expect(screen.getByText('FLOC-100')).not.toHaveAttribute('href');
    expect(screen.queryByRole('button', { name: 'FLOC-100' })).not.toBeInTheDocument();
  });

  it('shows the external id while the asset name loads, then the name', async () => {
    renderWithSelectedAsset();

    expect(screen.getByText('FLOC-100')).toBeInTheDocument();
    expect(await screen.findByText('Cooling Water Pump')).toBeInTheDocument();
  });

  function renderWithSelectedAsset() {
    store = makeNavigationStore({ selectedAsset });

    return render(<AssetTopbar />, { wrapper });
  }
});
