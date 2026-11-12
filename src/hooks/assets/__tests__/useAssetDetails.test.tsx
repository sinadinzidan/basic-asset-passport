import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import { AssetContext } from '../useAssetContext';
import {
  useAssetDetails,
  UseAssetDetailsContext,
  type UseAssetDetailsContextType,
} from '../useAssetDetails';

const assetIdentifier = { space: 'asset-space', externalId: 'asset-1' };

describe(useAssetDetails.name, () => {
  const client = makeMockClient();
  const details = makeInstanceDetails();
  let mockContext: UseAssetDetailsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      getAssetDetails: vi.fn(() => Promise.resolve(details)),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDetailsContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetDetailsContext.Provider>
    );
  });

  it('is pending until the details arrive', async () => {
    const { result } = renderHook(() => useAssetDetails(assetIdentifier), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the asset with the injected client', async () => {
    const { result } = renderHook(() => useAssetDetails(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(details));
    expect(mockContext.getAssetDetails).toHaveBeenCalledWith(client, assetIdentifier);
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.getAssetDetails).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAssetDetails(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
