import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../../../hooks/assets/useAssetEquipmentDetails';
import {
  UseAssetsContext,
  type UseAssetsContextType,
} from '../../../hooks/assets/useAssets';
import { makeAssetPage, makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { StateSyncApi } from '../../../types/host';
import { AssetRegister } from '../AssetRegister';

const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

describe(AssetRegister.name, () => {
  let api: StateSyncApi;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const assetsContext: UseAssetsContextType = {
      useAssetDataClient: vi.fn(() => client),
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const detailsContext: UseAssetEquipmentDetailsContextType = {
      useAssetDataClient: vi.fn(() => client),
      getAssetEquipmentDetails: vi.fn(() =>
        Promise.resolve({ asset: makeInstanceDetails(), equipment: [] }),
      ),
    };
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() =>
        Promise.resolve(true),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetsContext.Provider value={assetsContext}>
        <UseAssetEquipmentDetailsContext.Provider value={detailsContext}>
          <QueryWrapper>{children}</QueryWrapper>
        </UseAssetEquipmentDetailsContext.Provider>
      </UseAssetsContext.Provider>
    );
  });

  it('shows the asset register when no asset is selected', async () => {
    render(<AssetRegister api={api} />, { wrapper });

    expect(
      await screen.findByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('opens the asset restored from the shared link', async () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    });

    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('returns to the register and syncs the cleared selection', async () => {
    const initialState = JSON.stringify({ selectedAsset });
    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cooling Water Pump',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to assets' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
        }),
      ),
    );
  });
});
