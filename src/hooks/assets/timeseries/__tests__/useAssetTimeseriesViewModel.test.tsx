import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeseriesPreviewKind } from '../../../../enums/timeseriesPreviewKind';
import { getTimeseriesKey } from '../../../../lib/timeseriesProperties';
import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeLimitedList } from '../../../../mocks/lists';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import type { TimeseriesContextType } from '../../../../types/timeseries';
import { AssetContext } from '../../useAssetContext';
import {
  UseAssetTimeseriesContext,
  type UseAssetTimeseriesContextType,
} from '../useAssetTimeseries';
import { useAssetTimeseriesViewModel } from '../useAssetTimeseriesViewModel';
import { TimeseriesContext } from '../useTimeseriesContext';
import { UseTimeseriesTrendsContext } from '../useTimeseriesTrends';

const assetContext = makeMockClient();

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
  let datapoints: TimeseriesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    listContext = {
      listAssetTimeseries: vi.fn(() => Promise.resolve(makeLimitedList([pressure, status]))),
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
            now: () => 5000,
          }}
        >
          <QueryWrapper>
            <TimeseriesContext.Provider value={datapoints}>
              <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
            </TimeseriesContext.Provider>
          </QueryWrapper>
        </UseTimeseriesTrendsContext.Provider>
      </UseAssetTimeseriesContext.Provider>
    );
  });

  it('is pending until the series arrive', async () => {
    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('shows a loading preview until the readings arrive, then the readings', async () => {
    let deliver: (
      trends: Awaited<ReturnType<TimeseriesContextType['getTrends']>>,
    ) => void = () => {};
    vi.mocked(datapoints.getTrends).mockReturnValue(
      new Promise((resolve) => {
        deliver = resolve;
      }),
    );
    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items[0]?.preview).toEqual({ kind: TimeseriesPreviewKind.LOADING });

    deliver([{ space: 'ts', externalId: 'PI.1', points: POINTS }]);

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({
        kind: TimeseriesPreviewKind.READY,
        points: POINTS,
      }),
    );
  });

  it('reads only the numeric series', async () => {
    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(datapoints.getTrends).toHaveBeenCalled());
    expect(datapoints.getTrends).toHaveBeenCalledWith(
      [{ space: 'ts', externalId: 'PI.1' }],
      expect.anything(),
    );
    await waitFor(() =>
      expect(result.current.items[1]?.preview).toEqual({ kind: TimeseriesPreviewKind.NON_NUMERIC }),
    );
  });

  it('takes the unit from the series properties', async () => {
    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((item) => item.unit)).toEqual(['bar', null]);
  });

  it('shows an empty preview for a series without readings', async () => {
    vi.mocked(datapoints.getTrends).mockResolvedValue([]);

    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({ kind: TimeseriesPreviewKind.EMPTY }),
    );
  });

  it('shows an unavailable preview when the readings cannot be read', async () => {
    vi.mocked(datapoints.getTrends).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.items[0]?.preview).toEqual({ kind: TimeseriesPreviewKind.UNAVAILABLE }),
    );
  });

  it('shows an unavailable preview for a series whose readings failed while the rest loaded', async () => {
    const flow = makeInstanceDetails({ space: 'ts', externalId: 'PI.3', properties: [] });
    vi.mocked(listContext.listAssetTimeseries).mockResolvedValue(makeLimitedList([pressure, flow]));
    vi.mocked(datapoints.getTrends).mockResolvedValue([
      { space: 'ts', externalId: 'PI.1', points: [], hasFailed: true },
      { space: 'ts', externalId: 'PI.3', points: POINTS },
    ]);

    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.items.map((item) => item.preview)).toEqual([
        { kind: TimeseriesPreviewKind.UNAVAILABLE },
        { kind: TimeseriesPreviewKind.READY, points: POINTS },
      ]),
    );
  });

  it('hands out the same series and items while nothing changed', async () => {
    const { result, rerender } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.items[0]?.preview.kind).toBe(TimeseriesPreviewKind.READY),
    );
    const { items, timeseries } = result.current;

    rerender();

    expect(result.current.items).toBe(items);
    expect(result.current.timeseries).toBe(timeseries);
    expect(timeseries).toEqual([pressure, status]);
  });

  it('says that the asset has more series than were read', async () => {
    vi.mocked(listContext.listAssetTimeseries).mockResolvedValue(makeLimitedList([pressure], true));

    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('says that every series is read when the list ends', async () => {
    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps the series already read while a longer list loads', async () => {
    vi.mocked(listContext.listAssetTimeseries)
      .mockResolvedValueOnce(makeLimitedList([pressure], true))
      .mockReturnValueOnce(new Promise(() => {}));
    const { result, rerender } = renderHook(
      ({ limit }: { limit: number }) => useAssetTimeseriesViewModel(assetIdentifier, limit),
      { wrapper, initialProps: { limit: 1 } },
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    rerender({ limit: 2 });

    await waitFor(() => expect(result.current.isLoadingMore).toBe(true));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.isPending).toBe(false);
  });

  it('reports a failed list load', async () => {
    vi.mocked(listContext.listAssetTimeseries).mockRejectedValue(new Error('no'));

    const { result } = renderHook(() => useAssetTimeseriesViewModel(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no'));
    expect(getTimeseriesKey(pressure)).toBe('ts:PI.1');
  });
});
