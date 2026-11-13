import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NO_TAB_COUNTS } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { AssetTab } from '../../../enums/assetTab';
import { UseAssetEquipmentContext } from '../../../hooks/assets/equipment/useAssetEquipment';
import { AssetClientContext } from '../../../hooks/assets/useAssetClient';
import type { AssetDetailsTabCounts } from '../../../hooks/assets/useAssetDetailsTabCounts';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetEquipmentService } from '../../../services/assets/assetEquipment';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const assetContext = makeMockClient();

const asset = makeInstanceDetails({
  properties: [{ identifier: 'plantId', label: 'Plant ID', value: 'G307' }],
});

describe(AssetDetailsTabs.name, () => {
  let equipmentContext: AssetEquipmentService;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
    });
    equipmentContext = {
      listAssetEquipment: vi.fn(() =>
        Promise.resolve(
          makeLimitedList([makeInstanceDetails({ externalId: 'P-1', properties: [] })]),
        ),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetEquipmentContext.Provider
          value={{ createAssetEquipmentService: () => equipmentContext }}
        >
          <QueryWrapper>
            <AssetClientContext.Provider value={assetContext}>
              {children}
            </AssetClientContext.Provider>
          </QueryWrapper>
        </UseAssetEquipmentContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('shows the asset properties on the properties tab', () => {
    renderTabs(AssetTab.PROPERTIES);

    expect(screen.getByRole('tab', { name: 'Properties' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Plant ID')).toBeInTheDocument();
  });

  it('shows the asset external ID exactly as stored on the properties tab', () => {
    renderTabs(AssetTab.PROPERTIES, {
      asset: { ...asset, externalId: 'A-GF-G307-FFS2-RSHT2-FIREFIGHT' },
    });

    expect(screen.getByText('Asset ID: A-GF-G307-FFS2-RSHT2-FIREFIGHT')).toBeInTheDocument();
  });

  it('lists the equipment of the asset on the equipment tab', async () => {
    renderTabs(AssetTab.EQUIPMENTS);

    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
    expect(equipmentContext.listAssetEquipment).toHaveBeenCalledWith(
      { space: asset.space, externalId: asset.externalId },
      expect.any(Number),
    );
  });

  it('does not read the equipment while another tab is open', () => {
    renderTabs(AssetTab.PROPERTIES);

    expect(equipmentContext.listAssetEquipment).not.toHaveBeenCalled();
  });

  it('shows each list count on its tab', () => {
    renderTabs(AssetTab.PROPERTIES, {
      tabCounts: {
        equipment: { count: 3, isLoading: false },
        timeseries: { count: 4, isLoading: false },
        notes: { count: 2, isLoading: false },
        documents: { count: 7, isLoading: false },
      },
    });

    expect(screen.getByRole('tab', { name: /equipment/i })).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: /timeseries/i })).toHaveTextContent('4');
    expect(screen.getByRole('tab', { name: /notes/i })).toHaveTextContent('2');
    expect(screen.getByRole('tab', { name: /documents/i })).toHaveTextContent('7');
  });

  it('shows the whole count of a long list, with a thousands separator and no plus', () => {
    renderTabs(AssetTab.PROPERTIES, {
      tabCounts: {
        ...NO_TAB_COUNTS,
        equipment: { count: 1500, isLoading: false },
      },
    });

    expect(screen.getByRole('tab', { name: /equipment/i })).toHaveTextContent(/^Equipment1,500$/);
  });

  it('shows a zero for a list with nothing in it', () => {
    renderTabs(AssetTab.PROPERTIES, {
      tabCounts: {
        ...NO_TAB_COUNTS,
        notes: { count: 0, isLoading: false },
      },
    });

    expect(screen.getByRole('tab', { name: /notes/i })).toHaveTextContent('0');
  });

  it('shows no count on a tab whose list could not be counted, and leaves it open', () => {
    renderTabs(AssetTab.PROPERTIES);

    for (const name of ['Equipment', 'Timeseries', 'Notes', 'Documents']) {
      const tab = screen.getByRole('tab', { name });

      expect(tab).toHaveTextContent(new RegExp(`^${name}$`));
      expect(tab).not.toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('disables a tab while its list is being counted, and shows no count on it', () => {
    renderTabs(AssetTab.PROPERTIES, {
      tabCounts: {
        equipment: { count: null, isLoading: true },
        timeseries: { count: null, isLoading: true },
        notes: { count: 2, isLoading: false },
        documents: { count: null, isLoading: true },
      },
    });

    for (const name of ['Equipment', 'Timeseries', 'Documents']) {
      const tab = screen.getByRole('tab', { name });

      expect(tab).toHaveAttribute('aria-disabled', 'true');
      expect(tab).toHaveTextContent(new RegExp(`^${name}$`));
    }

    expect(screen.getByRole('tab', { name: /notes/i })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('does not disable the equipment tab that is open while the equipment is being counted', async () => {
    renderTabs(AssetTab.EQUIPMENTS, {
      tabCounts: {
        ...NO_TAB_COUNTS,
        equipment: { count: null, isLoading: true },
      },
    });

    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Equipment' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('never disables the properties tab', () => {
    renderTabs(AssetTab.EQUIPMENTS, {
      tabCounts: {
        equipment: { count: null, isLoading: true },
        timeseries: { count: null, isLoading: true },
        notes: { count: null, isLoading: true },
        documents: { count: null, isLoading: true },
      },
    });

    expect(screen.getByRole('tab', { name: 'Properties' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('opens the tab the user selects', async () => {
    renderTabs(AssetTab.PROPERTIES);

    await userEvent.click(screen.getByRole('tab', { name: /equipment/i }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.EQUIPMENTS);
    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
  });

  type TabsOptions = {
    asset?: typeof asset;
    tabCounts?: AssetDetailsTabCounts;
  };

  function renderTabs(activeAssetTab: AssetTab, options: TabsOptions = {}) {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
      activeAssetTab,
    });

    return render(
      <AssetDetailsTabs
        asset={options.asset ?? asset}
        tabCounts={options.tabCounts ?? NO_TAB_COUNTS}
      />,
      { wrapper },
    );
  }
});
