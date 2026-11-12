import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { TREND_GRANULARITY, TREND_WINDOW_MS } from '../../../../constants/timeseries';
import { getTimeseriesKey } from '../../../../lib/timeseriesProperties';
import type { TimeseriesContextType } from '../../../../types/timeseries';
import { TimeseriesContext } from '../useTimeseriesContext';
import { useTimeseriesTrends, UseTimeseriesTrendsContext } from '../useTimeseriesTrends';

const NOW = 1_800_000_000_000;
const first = { space: 'ts', externalId: 'PI.1' };
const second = { space: 'ts', externalId: 'PI.2' };

describe(useTimeseriesTrends.name, () => {
  let client: TimeseriesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    client = {
      project: 'p',
      getTrends: vi.fn(() =>
        Promise.resolve([{ ...first, points: [{ timestamp: NOW - 1000, value: 4 }] }]),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <TimeseriesContext.Provider value={client}>
        <UseTimeseriesTrendsContext.Provider value={{ now: () => NOW }}>
          <QueryWrapper>{children}</QueryWrapper>
        </UseTimeseriesTrendsContext.Provider>
      </TimeseriesContext.Provider>
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

  it('keys the trends by series', async () => {
    const { result } = renderHook(() => useTimeseriesTrends([first, second]), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.get(getTimeseriesKey(first))).toEqual({
      ...first,
      points: [{ timestamp: NOW - 1000, value: 4 }],
    });
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
