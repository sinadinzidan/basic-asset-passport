import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../../../hooks/assets/useAssetEquipmentDetails';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AssetEquipmentDetails } from '../../../types/asset';
import { AssetEquipmentRegister } from '../AssetEquipmentRegister';

const assetIdentifier = {
  space: 'asset-instance-space',
  externalId: 'FLOC-100',
};

function makeDetails(): AssetEquipmentDetails {
  return {
    asset: makeInstanceDetails({
      properties: [
        { identifier: 'name', label: 'Name', value: 'Cooling Water Pump' },
        { identifier: 'flocStatus', label: 'Status', value: 'Operating' },
        {
          identifier: 'abcIndicatorName',
          label: 'Criticality',
          value: 'A - High criticality',
        },
      ],
    }),
    equipment: [],
  };
}

describe(AssetEquipmentRegister.name, () => {
  let mockContext: UseAssetEquipmentDetailsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let onBack: () => void;
  let onTabChange: (tab: AssetEquipmentTab) => void;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      getAssetEquipmentDetails: vi.fn(() => Promise.resolve(makeDetails())),
    };
    onBack = vi.fn();
    onTabChange = vi.fn();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetEquipmentDetailsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetEquipmentDetailsContext.Provider>
    );
  });

  function renderRegister() {
    return render(
      <AssetEquipmentRegister
        assetIdentifier={assetIdentifier}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={onTabChange}
        onBack={onBack}
      />,
      { wrapper },
    );
  }

  it('shows a loading status with a way back while details load', () => {
    vi.mocked(mockContext.getAssetEquipmentDetails).mockReturnValue(
      new Promise(() => {}),
    );

    renderRegister();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading asset and equipment properties...',
    );
    expect(
      screen.getByRole('button', { name: 'Back to assets' }),
    ).toBeEnabled();
  });

  it('shows the asset name, status and criticality', async () => {
    renderRegister();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Operating', { selector: '[data-slot="badge"]' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Criticality A - High criticality'),
    ).toBeInTheDocument();
  });

  it('falls back to the external id and omits missing badges', async () => {
    vi.mocked(mockContext.getAssetEquipmentDetails).mockResolvedValue({
      asset: makeInstanceDetails({ externalId: 'FLOC-100', properties: [] }),
      equipment: [],
    });

    renderRegister();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'FLOC-100' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Criticality/)).not.toBeInTheDocument();
  });

  it('goes back to the asset list', async () => {
    renderRegister();
    await screen.findByRole('heading', { level: 1 });

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to assets' }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('reports the selected tab', async () => {
    renderRegister();

    await userEvent.click(
      await screen.findByRole('tab', { name: /equipments/i }),
    );

    expect(onTabChange).toHaveBeenCalledWith(AssetEquipmentTab.EQUIPMENTS);
  });

  it('offers a retry when the details cannot be loaded', async () => {
    vi.mocked(mockContext.getAssetEquipmentDetails).mockRejectedValueOnce(
      new Error('failed'),
    );

    renderRegister();

    expect(
      await screen.findByText('Asset details could not be loaded'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to assets' }),
    ).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
  });
});
