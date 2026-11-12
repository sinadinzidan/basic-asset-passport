import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { STATUS_PROPERTY_IDENTIFIER } from '../../../constants/assets';
import { AssetTab } from '../../../enums/assetTab';
import { UseAssetEquipmentContext } from '../../../hooks/assets/equipment/useAssetEquipment';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import {
  UseAssetDetailsContext,
  type UseAssetDetailsContextType,
} from '../../../hooks/assets/useAssetDetails';
import {
  UseAssetDetailsTabCountsContext,
  type UseAssetDetailsTabCountsContextType,
} from '../../../hooks/assets/useAssetDetailsTabCounts';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { makeAssetDetailsTabCountsContext } from '../../../mocks/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../mocks/lists';
import { makeNavigationStore } from '../../../mocks/navigation';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
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
  let mockContext: UseAssetDetailsContextType;
  let tabCountsContext: UseAssetDetailsTabCountsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    mockContext = {
      getAssetDetails: vi.fn(() => Promise.resolve(makeDetails())),
    };
    tabCountsContext = makeAssetDetailsTabCountsContext();
    store = makeNavigationStore();
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
        <UseAssetDetailsContext.Provider value={mockContext}>
          <UseAssetDetailsTabCountsContext.Provider value={tabCountsContext}>
            <UseAssetEquipmentContext.Provider value={equipmentContext}>
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
    return render(<AssetDetails assetIdentifier={assetIdentifier} />, { wrapper });
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
          property.identifier === STATUS_PROPERTY_IDENTIFIER
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
      expect(count).toHaveBeenCalledWith(expect.anything(), assetIdentifier);
    }
  });

  it('shows the count of each tab once it is counted', async () => {
    renderRegister();

    expect(await screen.findByRole('tab', { name: /equipments/i })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: /timeseries/i })).toHaveTextContent(
      /^Timeseries3$/,
    );
    expect(screen.getByRole('tab', { name: /equipments/i })).toHaveTextContent(/^Equipments1$/);
    expect(screen.getByRole('tab', { name: /notes/i })).toHaveTextContent(/^Notes2$/);
    expect(screen.getByRole('tab', { name: /documents/i })).toHaveTextContent(/^Documents4$/);
  });

  it('opens the selected tab', async () => {
    renderRegister();

    await userEvent.click(await screen.findByRole('tab', { name: /equipments/i }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.EQUIPMENTS);
    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
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
