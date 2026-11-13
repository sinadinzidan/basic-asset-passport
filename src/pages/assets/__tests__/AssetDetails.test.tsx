import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeAssetDetailsTabCountsContext } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { MODEL } from '../../../config/model';
import { AssetTab } from '../../../enums/assetTab';
import { UseAssetEquipmentContext } from '../../../hooks/assets/equipment/useAssetEquipment';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { UseAssetDetailsContext } from '../../../hooks/assets/useAssetDetails';
import { UseAssetDetailsTabCountsContext } from '../../../hooks/assets/useAssetDetailsTabCounts';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetDetailsService } from '../../../services/assets/assetDetails';
import type { AssetDetailsTabCountService } from '../../../services/assets/assetDetailsTabCounts';
import type { AssetInstanceDetails } from '../../../types/asset';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetails } from '../AssetDetails';

const assetContext = makeMockClient();

const assetIdentifier = {
  space: 'asset-instance-space',
  externalId: 'FLOC-100',
};

function makeDetails(): AssetInstanceDetails {
  return makeInstanceDetails({
    properties: [
      { identifier: 'name', label: 'Name', value: 'Cooling Water Pump' },
      { identifier: 'flocStatus', label: 'Status', value: 'Operating' },
      {
        identifier: 'abcIndicatorName',
        label: 'Criticality',
        value: 'A - High criticality',
      },
    ],
  });
}

describe(AssetDetails.name, () => {
  let mockContext: AssetDetailsService;
  let tabCountsContext: AssetDetailsTabCountService;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    mockContext = {
      getAssetDetails: vi.fn(() => Promise.resolve(makeDetails())),
    };
    tabCountsContext = makeAssetDetailsTabCountsContext();
    store = makeNavigationStore({ selectedAsset: assetIdentifier });
    const equipmentContext = {
      listAssetEquipment: vi.fn(() =>
        Promise.resolve(
          makeLimitedList([makeInstanceDetails({ externalId: 'P-1', properties: [] })]),
        ),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetDetailsContext.Provider value={{ createAssetDetailsService: () => mockContext }}>
          <UseAssetDetailsTabCountsContext.Provider
            value={{ createAssetDetailsTabCountService: () => tabCountsContext }}
          >
            <UseAssetEquipmentContext.Provider
              value={{ createAssetEquipmentService: () => equipmentContext }}
            >
              <QueryWrapper>
                <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
              </QueryWrapper>
            </UseAssetEquipmentContext.Provider>
          </UseAssetDetailsTabCountsContext.Provider>
        </UseAssetDetailsContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  function renderRegister() {
    return render(<AssetDetails />, { wrapper });
  }

  it('shows only a loading status while details load', () => {
    vi.mocked(mockContext.getAssetDetails).mockReturnValue(new Promise(() => {}));

    renderRegister();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading asset and equipment properties...',
    );
  });

  it('shows the asset name, status and criticality', async () => {
    renderRegister();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Operating', { selector: '[data-slot="badge"]' })).toBeInTheDocument();
    expect(
      screen.getByText('A - High criticality', { selector: '[data-tone]' }),
    ).toBeInTheDocument();
  });

  it('shows a status other than Operating as neutral', async () => {
    const details = makeDetails();

    vi.mocked(mockContext.getAssetDetails).mockResolvedValue(
      makeInstanceDetails({
        properties: details.properties.map((property) =>
          property.identifier === MODEL.properties.asset.status
            ? { ...property, value: 'IN SERVICE' }
            : property,
        ),
      }),
    );

    renderRegister();

    const pill = await screen.findByText('IN SERVICE', {
      selector: '[data-slot="badge"]',
    });

    expect(pill).toHaveAttribute('data-tone', 'neutral');
  });

  it('falls back to the external id and omits missing badges', async () => {
    vi.mocked(mockContext.getAssetDetails).mockResolvedValue(
      makeInstanceDetails({ externalId: 'FLOC-100', properties: [] }),
    );

    renderRegister();

    expect(await screen.findByRole('heading', { level: 1, name: 'FLOC-100' })).toBeInTheDocument();
    expect(screen.queryByText(/Criticality/)).not.toBeInTheDocument();
  });

  it('has no back button: the breadcrumb in the header is the way back', async () => {
    renderRegister();
    await screen.findByRole('heading', { level: 1 });

    expect(screen.queryByRole('button', { name: 'Back to assets' })).not.toBeInTheDocument();
  });

  it('starts counting the tabs while the asset is still loading', () => {
    vi.mocked(mockContext.getAssetDetails).mockReturnValue(new Promise(() => {}));

    renderRegister();

    for (const count of [
      tabCountsContext.countAssetEquipment,
      tabCountsContext.countAssetNotes,
      tabCountsContext.countAssetTimeseries,
      tabCountsContext.countAssetDocuments,
      tabCountsContext.countAssetLinkedFiles,
    ]) {
      expect(count).toHaveBeenCalledWith(assetIdentifier);
    }
  });

  it('shows the count of each tab once it is counted', async () => {
    renderRegister();

    expect(await screen.findByRole('tab', { name: /equipment/i })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /timeseries/i })).toHaveTextContent(
      /^Timeseries3$/,
    );
    expect(screen.getByRole('tab', { name: /equipment/i })).toHaveTextContent(/^Equipment1$/);
    expect(screen.getByRole('tab', { name: /notes/i })).toHaveTextContent(/^Notes2$/);
    expect(screen.getByRole('tab', { name: /documents/i })).toHaveTextContent(/^Documents4$/);
  });

  it('opens the selected tab', async () => {
    renderRegister();

    await userEvent.click(await screen.findByRole('tab', { name: /equipment/i }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.EQUIPMENTS);
    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
  });

  it('shows the reason the details cannot be loaded', async () => {
    vi.mocked(mockContext.getAssetDetails).mockRejectedValue(new Error('No access to the view.'));

    renderRegister();

    expect(await screen.findByText('Reason: No access to the view.')).toBeInTheDocument();
  });

  it('offers a retry when the details cannot be loaded', async () => {
    vi.mocked(mockContext.getAssetDetails).mockRejectedValueOnce(new Error('failed'));

    renderRegister();

    expect(await screen.findByText('Asset details could not be loaded')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
  });
});
