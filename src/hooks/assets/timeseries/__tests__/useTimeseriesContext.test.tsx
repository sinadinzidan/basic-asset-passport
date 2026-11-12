import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TimeseriesContextType } from '../../../../types/timeseries';
import { TimeseriesContext, useTimeseriesContext } from '../useTimeseriesContext';

describe(useTimeseriesContext.name, () => {
  it('returns the client from the provider', () => {
    const client: TimeseriesContextType = {
      project: 'p',
      getTrends: vi.fn(),
    };

    const { result } = renderHook(() => useTimeseriesContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TimeseriesContext.Provider value={client}>{children}</TimeseriesContext.Provider>
      ),
    });

    expect(result.current).toBe(client);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTimeseriesContext())).toThrow(
      'useTimeseriesContext must be used inside',
    );
  });
});
