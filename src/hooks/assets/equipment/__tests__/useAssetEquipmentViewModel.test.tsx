import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetEquipmentService } from '../../../../services/assets/assetEquipment';
import { AssetContext } from '../../useAssetContext';
import { UseAssetEquipmentContext } from '../useAssetEquipment';
import { useAssetEquipmentViewModel } from '../useAssetEquipmentViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });
const pump = makeInstanceDetails({ externalId: 'P-1', properties: [] });

describe(useAssetEquipmentViewModel.name, () => {
  const client = makeMockClient();
  let equipmentService: AssetEquipmentService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    equipmentService = {
      listAssetEquipment: vi.fn(() => Promise.resolve(makeLimitedList([pump], true))),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetEquipmentContext.Provider
        value={{ createAssetEquipmentService: () => equipmentService }}
      >
        <QueryWrapper>
          <AssetContext.Provider value={client}>
            <NavigationStoreContext.Provider value={navigationStore}>
              {children}
            </NavigationStoreContext.Provider>
          </AssetContext.Provider>
        </QueryWrapper>
      </UseAssetEquipmentContext.Provider>
    );
  });

  it('is pending with no equipment until the list arrives', async () => {
    const { result } = renderHook(() => useAssetEquipmentViewModel(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.equipment).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the equipment of the asset and whether the asset has more', async () => {
    const { result } = renderHook(() => useAssetEquipmentViewModel(), { wrapper });

    await waitFor(() => expect(result.current.equipment).toEqual([pump]));
    expect(result.current.hasMore).toBe(true);
  });

  it('reports a failed load with its error and reads again on retry', async () => {
    vi.mocked(equipmentService.listAssetEquipment).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderHook(() => useAssetEquipmentViewModel(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.equipment).toEqual([pump]));
  });
});
