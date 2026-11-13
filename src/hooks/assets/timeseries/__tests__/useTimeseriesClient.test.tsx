import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TimeseriesContextType } from '../../../../types/timeseries';
import { TimeseriesClientContext, useTimeseriesClient } from '../useTimeseriesClient';

describe(useTimeseriesClient.name, () => {
  it('returns the client from the provider', () => {
    const client: TimeseriesContextType = {
      project: 'p',
      getTrends: vi.fn(),
    };

    const { result } = renderHook(() => useTimeseriesClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TimeseriesClientContext.Provider value={client}>
          {children}
        </TimeseriesClientContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTimeseriesClient())).toThrow(
      'useTimeseriesClient must be used inside',
    );
  });
});
