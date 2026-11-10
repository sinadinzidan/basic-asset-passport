import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import type { TimeseriesDatapointsClient } from '../../../../types/timeseries';
import {
  UseTimeseriesTrendsContext,
  getTimeseriesKey,
} from '../../../timeseries/useTimeseriesTrends';
import {
  UseAssetTimeseriesContext,
  type UseAssetTimeseriesContextType,
} from '../useAssetTimeseries';
import { useAssetTimeseriesViewModel } from '../useAssetTimeseriesViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.1',
  properties: [
    { identifier: 'name', label: 'Name', value: 'Pressure' },
    { identifier: 'type', label: 'Type', value: 'numeric' },
    { identifier: 'engunits', label: 'Unit', value: 'bar' },
  ],
});
const status = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.2',
  properties: [{ identifier: 'type', label: 'Type', value: 'string' }],
});
const POINTS = [{ timestamp: 1000, value: 3 }];

describe(useAssetTimeseriesViewModel.name, () => {
  let listContext: UseAssetTimeseriesContextType;
  let datapoints: TimeseriesDatapointsClient;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    listContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      listAssetTimeseries: vi.fn(() => Promise.resolve([pressure, status])),
    };
    datapoints = {
      project: 'p',
      getTrends: vi.fn(() =>
        Promise.resolve([{ space: 'ts', externalId: 'PI.1', points: POINTS }]),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetTimeseriesContext.Provider value={listContext}>
        <UseTimeseriesTrendsContext.Provider
          value={{
            useTimeseriesDatapointsClient: () => datapoints,
            now: () => 5000,
          }}
        >
          <QueryWrapper>{children}</QueryWrapper>
        </UseTimeseriesTrendsContext.Provider>
      </UseAssetTimeseriesContext.Provider>
    );
  });

  it('is pending until the series arrive', async () => {
    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('shows a loading preview until the readings arrive, then the readings', async () => {
    let deliver: (
      trends: Awaited<ReturnType<TimeseriesDatapointsClient['getTrends']>>,
    ) => void = () => {};
    vi.mocked(datapoints.getTrends).mockReturnValue(
      new Promise((resolve) => {
        deliver = resolve;
      }),
    );
    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items[0]?.preview).toEqual({ kind: 'LOADING' });

    deliver([{ space: 'ts', externalId: 'PI.1', points: POINTS }]);

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({
        kind: 'READY',
        points: POINTS,
      }),
    );
  });

  it('reads only the numeric series', async () => {
    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(datapoints.getTrends).toHaveBeenCalled());
    expect(datapoints.getTrends).toHaveBeenCalledWith(
      [{ space: 'ts', externalId: 'PI.1' }],
      expect.anything(),
    );
    await waitFor(() =>
      expect(result.current.items[1]?.preview).toEqual({ kind: 'NON_NUMERIC' }),
    );
  });

  it('takes the unit from the series properties', async () => {
    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((item) => item.unit)).toEqual([
      'bar',
      null,
    ]);
  });

  it('shows an empty preview for a series without readings', async () => {
    vi.mocked(datapoints.getTrends).mockResolvedValue([]);

    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({ kind: 'EMPTY' }),
    );
  });

  it('shows an unavailable preview when the readings cannot be read', async () => {
    vi.mocked(datapoints.getTrends).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({ kind: 'UNAVAILABLE' }),
    );
  });

  it('reports a failed list load', async () => {
    vi.mocked(listContext.listAssetTimeseries).mockRejectedValue(
      new Error('no'),
    );

    const { result } = renderHook(
      () => useAssetTimeseriesViewModel(assetIdentifier),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(getTimeseriesKey(pressure)).toBe('ts:PI.1');
  });
});
