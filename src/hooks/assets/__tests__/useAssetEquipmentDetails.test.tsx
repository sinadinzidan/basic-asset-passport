import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AssetEquipmentDetails } from '../../../types/asset';
import {
  useAssetEquipmentDetails,
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../useAssetEquipmentDetails';

const assetIdentifier = { space: 'asset-space', externalId: 'asset-1' };

describe(useAssetEquipmentDetails.name, () => {
  const client = makeMockClient();
  const details: AssetEquipmentDetails = {
    asset: makeInstanceDetails(),
    equipment: [],
  };
  let mockContext: UseAssetEquipmentDetailsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useCogniteSdk: vi.fn(() => client),
      getAssetEquipmentDetails: vi.fn(() => Promise.resolve(details)),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetEquipmentDetailsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetEquipmentDetailsContext.Provider>
    );
  });

  it('is pending until the details arrive', async () => {
    const { result } = renderHook(
      () => useAssetEquipmentDetails(assetIdentifier),
      { wrapper },
    );

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the details of the given asset with the injected client', async () => {
    const { result } = renderHook(
      () => useAssetEquipmentDetails(assetIdentifier),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toEqual(details));
    expect(mockContext.getAssetEquipmentDetails).toHaveBeenCalledWith(
      client,
      assetIdentifier,
    );
  });

  it('reports a failed load as an error', async () => {
    vi.mocked(mockContext.getAssetEquipmentDetails).mockRejectedValue(
      new Error('failed'),
    );

    const { result } = renderHook(
      () => useAssetEquipmentDetails(assetIdentifier),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
