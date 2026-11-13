import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { UseAssetEquipmentContext } from '../../../../hooks/assets/equipment/useAssetEquipment';
import { AssetClientContext } from '../../../../hooks/assets/useAssetClient';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetEquipmentService } from '../../../../services/assets/assetEquipment';
import { AssetEquipment } from '../AssetEquipment';

const assetContext = makeMockClient();

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });

describe(AssetEquipment.name, () => {
  let mockContext: AssetEquipmentService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetEquipment: vi.fn(() => Promise.resolve(makeLimitedList(makeEquipment(2)))),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetEquipmentContext.Provider value={{ createAssetEquipmentService: () => mockContext }}>
        <QueryWrapper>
          <AssetClientContext.Provider value={assetContext}>
            <NavigationStoreContext.Provider value={navigationStore}>
              {children}
            </NavigationStoreContext.Provider>
          </AssetClientContext.Provider>
        </QueryWrapper>
      </UseAssetEquipmentContext.Provider>
    );
  });

  it('shows a loading status while the equipment is read', () => {
    vi.mocked(mockContext.listAssetEquipment).mockReturnValue(new Promise(() => undefined));

    renderEquipment();

    expect(screen.getByRole('status')).toHaveTextContent('Loading equipment...');
  });

  it('lists every equipment linked to the asset', async () => {
    renderEquipment();

    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
    expect(screen.getByText('Equipment ID: P-2')).toBeInTheDocument();
  });

  it('reads the equipment of the asset it is given', async () => {
    renderEquipment();

    await screen.findByText('Equipment ID: P-1');
    expect(mockContext.listAssetEquipment).toHaveBeenCalledWith(
      assetIdentifier,
      expect.any(Number),
    );
  });

  it('shows an empty state when no equipment is linked', async () => {
    vi.mocked(mockContext.listAssetEquipment).mockResolvedValue(makeLimitedList([]));

    renderEquipment();

    expect(await screen.findByText('No equipment linked')).toBeInTheDocument();
  });

  it('says that only the first equipment are shown when the asset has more', async () => {
    vi.mocked(mockContext.listAssetEquipment).mockResolvedValue(
      makeLimitedList(makeEquipment(3), true),
    );

    renderEquipment();

    expect(
      await screen.findByText(
        'Showing the first 3 equipment, sorted by name. This asset has more.',
      ),
    ).toBeInTheDocument();
  });

  it('shows no notice when every equipment is shown', async () => {
    renderEquipment();

    await screen.findByText('Equipment ID: P-1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers a retry when the equipment cannot be loaded, and lists it once it can', async () => {
    vi.mocked(mockContext.listAssetEquipment).mockRejectedValueOnce(new Error('failed'));

    renderEquipment();

    expect(await screen.findByText('Equipment could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Reason: failed')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Equipment ID: P-1')).toBeInTheDocument();
  });

  function renderEquipment() {
    return render(<AssetEquipment />, {
      wrapper,
    });
  }
});

function makeEquipment(count: number) {
  return Array.from({ length: count }, (_item, index) =>
    makeInstanceDetails({ externalId: `P-${index + 1}`, properties: [] }),
  );
}
