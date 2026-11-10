import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import {
  useAssetTimeseries,
  UseAssetTimeseriesContext,
  type UseAssetTimeseriesContextType,
} from '../useAssetTimeseries';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetTimeseries.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetTimeseriesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetTimeseries: vi.fn(() =>
        Promise.resolve([makeInstanceDetails({ externalId: 'PI.1' })]),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetTimeseriesContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetTimeseriesContext.Provider>
    );
  });

  it('is pending until the series arrive', async () => {
    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the series of the asset with the injected client', async () => {
    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(mockContext.listAssetTimeseries).toHaveBeenCalledWith(
      client,
      assetIdentifier,
    );
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetTimeseries).mockRejectedValue(
      new Error('no access'),
    );

    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
