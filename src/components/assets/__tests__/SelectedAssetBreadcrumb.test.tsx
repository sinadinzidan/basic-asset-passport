import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { AssetClientContext } from '../../../hooks/assets/useAssetClient';
import { UseAssetDetailsContext } from '../../../hooks/assets/useAssetDetails';
import {
  NavigationStoreContext,
  useNavigationState,
} from '../../../hooks/general/useNavigationState';
import type { AssetDetailsService } from '../../../services/assets/assetDetails';
import type { NavigationStore } from '../../../types/navigation';
import { SelectedAssetBreadcrumb } from '../SelectedAssetBreadcrumb';

const assetClient = makeMockClient();
const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

describe(SelectedAssetBreadcrumb.name, () => {
  let store: StoreApi<NavigationStore>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const detailsService: AssetDetailsService = {
      getAssetDetails: vi.fn(() => Promise.resolve(makeInstanceDetails())),
    };
    const QueryWrapper = makeQueryClientWrapper();

    store = makeNavigationStore({ selectedAsset });
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetDetailsContext.Provider
          value={{ createAssetDetailsService: () => detailsService }}
        >
          <QueryWrapper>
            <AssetClientContext.Provider value={assetClient}>
              {children}
            </AssetClientContext.Provider>
          </QueryWrapper>
        </UseAssetDetailsContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('shows the way to the open asset: the asset table as a link, then the asset as the current page', async () => {
    render(<WhileAnAssetIsOpen />, { wrapper });

    const items = screen.getAllByRole('listitem');

    expect(within(items[0]).getByRole('button', { name: 'Assets' })).toBeInTheDocument();
    expect(await screen.findByText('Cooling Water Pump')).toHaveAttribute('aria-current', 'page');
  });

  it('goes back to the asset table from the first step', async () => {
    const user = userEvent.setup();

    render(<WhileAnAssetIsOpen />, { wrapper });

    await user.click(screen.getByRole('button', { name: 'Assets' }));

    expect(store.getState().navigationState.selectedAsset).toBeNull();
    expect(screen.queryByRole('button', { name: 'Assets' })).not.toBeInTheDocument();
  });

  it('does not make the current page something to click', () => {
    render(<WhileAnAssetIsOpen />, { wrapper });

    expect(screen.getByText('FLOC-100')).not.toHaveAttribute('href');
    expect(screen.queryByRole('button', { name: 'FLOC-100' })).not.toBeInTheDocument();
  });

  it('shows the external id while the asset name loads, then the name', async () => {
    render(<WhileAnAssetIsOpen />, { wrapper });

    expect(screen.getByText('FLOC-100')).toBeInTheDocument();
    expect(await screen.findByText('Cooling Water Pump')).toBeInTheDocument();
  });
});

function WhileAnAssetIsOpen() {
  const openAsset = useNavigationState((navigation) => navigation.navigationState.selectedAsset);

  return openAsset ? <SelectedAssetBreadcrumb /> : null;
}
