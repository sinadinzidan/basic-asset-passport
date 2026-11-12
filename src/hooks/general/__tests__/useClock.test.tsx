import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ClockContext, useClock } from '../useClock';

describe(useClock.name, () => {
  it('reads the time of the device by default', () => {
    const before = Date.now();

    const { result } = renderHook(() => useClock());

    expect(result.current()).toBeGreaterThanOrEqual(before);
  });

  it('reads the time its context supplies', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ClockContext.Provider value={{ now: () => 5000 }}>{children}</ClockContext.Provider>
    );

    const { result } = renderHook(() => useClock(), { wrapper });

    expect(result.current()).toBe(5000);
  });
});
