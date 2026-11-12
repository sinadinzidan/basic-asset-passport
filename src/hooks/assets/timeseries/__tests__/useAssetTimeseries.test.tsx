import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { TIMESERIES_QUERY_LIMIT } from '../../../../constants/timeseries';
import { AssetContext } from '../../useAssetContext';
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
      listAssetTimeseries: vi.fn(() =>
        Promise.resolve(makeLimitedList([makeInstanceDetails({ externalId: 'PI.1' })])),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetTimeseriesContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetTimeseriesContext.Provider>
    );
  });

  it('is pending until the series arrive', async () => {
    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('loads the series of the asset with the injected client', async () => {
    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data?.items).toHaveLength(1));
    expect(mockContext.listAssetTimeseries).toHaveBeenCalledWith(
      client,
      assetIdentifier,
      TIMESERIES_QUERY_LIMIT,
    );
  });

  it('reads the series to the limit asked for', async () => {
    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier, 400), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mockContext.listAssetTimeseries).toHaveBeenCalledWith(client, assetIdentifier, 400);
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetTimeseries).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAssetTimeseries(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
