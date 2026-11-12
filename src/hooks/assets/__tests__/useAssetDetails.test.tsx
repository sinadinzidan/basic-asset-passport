import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import type { AssetDetailsService } from '../../../services/assets/assetDetails';
import { AssetContext } from '../useAssetContext';
import { useAssetDetails, UseAssetDetailsContext } from '../useAssetDetails';

const assetIdentifier = { space: 'asset-space', externalId: 'asset-1' };

describe(useAssetDetails.name, () => {
  const client = makeMockClient();
  const details = makeInstanceDetails();
  let mockContext: AssetDetailsService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      getAssetDetails: vi.fn(() => Promise.resolve(details)),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDetailsContext.Provider value={{ createAssetDetailsService: () => mockContext }}>
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
    expect(mockContext.getAssetDetails).toHaveBeenCalledWith(assetIdentifier);
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.getAssetDetails).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useAssetDetails(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
