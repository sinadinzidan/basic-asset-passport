import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TimeseriesDatapointsClient } from '../../../types/timeseries';
import {
  TimeseriesDatapointsClientContext,
  useTimeseriesDatapointsClient,
} from '../useTimeseriesDatapointsClient';

describe(useTimeseriesDatapointsClient.name, () => {
  it('returns the client from the provider', () => {
    const client: TimeseriesDatapointsClient = {
      project: 'p',
      getTrends: vi.fn(),
    };

    const { result } = renderHook(() => useTimeseriesDatapointsClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TimeseriesDatapointsClientContext.Provider value={client}>
          {children}
        </TimeseriesDatapointsClientContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTimeseriesDatapointsClient())).toThrow(
      'useTimeseriesDatapointsClient must be used inside',
    );
  });
});
