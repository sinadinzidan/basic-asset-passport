import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { ASSET_EQUIPMENT_QUERY_LIMIT } from '../../../../constants/assets';
import type { AssetEquipmentService } from '../../../../services/assets/assetEquipment';
import { AssetClientContext } from '../../useAssetClient';
import { useAssetEquipment, UseAssetEquipmentContext } from '../useAssetEquipment';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetEquipment.name, () => {
  const client = makeMockClient();
  let mockContext: AssetEquipmentService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetEquipment: vi.fn(() =>
        Promise.resolve(makeLimitedList([makeInstanceDetails({ externalId: 'P-1' })])),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetEquipmentContext.Provider value={{ createAssetEquipmentService: () => mockContext }}>
        <QueryWrapper>
          <AssetClientContext.Provider value={client}>{children}</AssetClientContext.Provider>
        </QueryWrapper>
      </UseAssetEquipmentContext.Provider>
    );
  });

  it('is pending until the equipment arrives', async () => {
    const { result } = renderHook(() => useAssetEquipment(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('loads the equipment of the asset to the usual limit with the injected client', async () => {
    const { result } = renderHook(() => useAssetEquipment(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data?.items).toHaveLength(1));
    expect(mockContext.listAssetEquipment).toHaveBeenCalledWith(
      assetIdentifier,
      ASSET_EQUIPMENT_QUERY_LIMIT,
    );
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.listAssetEquipment).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAssetEquipment(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('keeps another asset waiting instead of showing the equipment of the first', async () => {
    const { result, rerender } = renderHook(({ identifier }) => useAssetEquipment(identifier), {
      wrapper,
      initialProps: { identifier: assetIdentifier },
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    vi.mocked(mockContext.listAssetEquipment).mockReturnValue(new Promise(() => undefined));

    rerender({ identifier: { ...assetIdentifier, externalId: 'FLOC-2' } });

    expect(result.current.data).toBeUndefined();
  });
});
