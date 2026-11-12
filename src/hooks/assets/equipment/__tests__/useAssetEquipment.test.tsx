import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ASSET_EQUIPMENT_QUERY_LIMIT } from '../../../../constants/assets';
import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../../mocks/lists';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import { AssetContext } from '../../useAssetContext';
import {
  useAssetEquipment,
  UseAssetEquipmentContext,
  type UseAssetEquipmentContextType,
} from '../useAssetEquipment';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetEquipment.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetEquipmentContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetEquipment: vi.fn(() =>
        Promise.resolve(makeLimitedList([makeInstanceDetails({ externalId: 'P-1' })])),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetEquipmentContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetEquipmentContext.Provider>
    );
  });

  it('is pending until the equipment arrives', async () => {
    const { result } = renderHook(() => useAssetEquipment(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the equipment of the asset to the usual limit with the injected client', async () => {
    const { result } = renderHook(() => useAssetEquipment(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data?.items).toHaveLength(1));
    expect(mockContext.listAssetEquipment).toHaveBeenCalledWith(
      client,
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
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    vi.mocked(mockContext.listAssetEquipment).mockReturnValue(new Promise(() => undefined));

    rerender({ identifier: { ...assetIdentifier, externalId: 'FLOC-2' } });

    expect(result.current.data).toBeUndefined();
  });
});
