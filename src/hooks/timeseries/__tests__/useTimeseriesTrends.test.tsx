import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TREND_GRANULARITY,
  TREND_WINDOW_MS,
} from '../../../constants/timeseries';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { TimeseriesDatapointsClient } from '../../../types/timeseries';
import {
  getTimeseriesKey,
  useTimeseriesTrends,
  UseTimeseriesTrendsContext,
} from '../useTimeseriesTrends';

const NOW = 1_800_000_000_000;
const first = { space: 'ts', externalId: 'PI.1' };
const second = { space: 'ts', externalId: 'PI.2' };

describe(useTimeseriesTrends.name, () => {
  let client: TimeseriesDatapointsClient;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    client = {
      project: 'p',
      getTrends: vi.fn(() =>
        Promise.resolve([
          { ...first, points: [{ timestamp: NOW - 1000, value: 4 }] },
        ]),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseTimeseriesTrendsContext.Provider
        value={{ useTimeseriesDatapointsClient: () => client, now: () => NOW }}
      >
        <QueryWrapper>{children}</QueryWrapper>
      </UseTimeseriesTrendsContext.Provider>
    );
  });

  it('reads the last 6 months of the series in one batch', async () => {
    const { result } = renderHook(() => useTimeseriesTrends([first, second]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getTrends).toHaveBeenCalledTimes(1);
    expect(client.getTrends).toHaveBeenCalledWith([first, second], {
      from: NOW - TREND_WINDOW_MS,
      to: NOW,
      granularity: TREND_GRANULARITY,
    });
  });

  it('keys the points by series', async () => {
    const { result } = renderHook(() => useTimeseriesTrends([first, second]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.get(getTimeseriesKey(first))).toEqual([
      { timestamp: NOW - 1000, value: 4 },
    ]);
    expect(result.current.data?.has(getTimeseriesKey(second))).toBe(false);
  });

  it('fetches nothing for an empty list', () => {
    const { result } = renderHook(() => useTimeseriesTrends([]), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.getTrends).not.toHaveBeenCalled();
  });

  it('reports a failed read', async () => {
    vi.mocked(client.getTrends).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useTimeseriesTrends([first]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
