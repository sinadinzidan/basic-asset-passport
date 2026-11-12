import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChartTimersContext, systemChartTimers, useChartTimers } from '../useChartTimers';
import type { ChartTimers } from '../useChartTimers';

describe(useChartTimers.name, () => {
  it('gives the timers of the system unless others are provided', () => {
    const { result } = renderHook(() => useChartTimers());

    expect(result.current).toBe(systemChartTimers);
  });

  it('gives the timers that are provided', () => {
    const timers: ChartTimers = {
      setInterval: () => assert.fail('Not used'),
      clearInterval: () => assert.fail('Not used'),
      setTimeout: () => assert.fail('Not used'),
      clearTimeout: () => assert.fail('Not used'),
      requestFrame: () => assert.fail('Not used'),
      cancelFrame: () => assert.fail('Not used'),
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ChartTimersContext.Provider value={timers}>{children}</ChartTimersContext.Provider>
    );

    const { result } = renderHook(() => useChartTimers(), { wrapper });

    expect(result.current).toBe(timers);
  });
});

describe('systemChartTimers', () => {
  // These are the window's own timers, so the tests drive them with fake timers.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs a timeout once, after its delay', () => {
    const callback = vi.fn();

    systemChartTimers.setTimeout(callback, 500);
    vi.advanceTimersByTime(499);
    const callsBeforeTheDelay = callback.mock.calls.length;
    vi.advanceTimersByTime(1000);

    expect(callsBeforeTheDelay).toBe(0);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not run a timeout that was cleared', () => {
    const callback = vi.fn();

    const handle = systemChartTimers.setTimeout(callback, 500);
    systemChartTimers.clearTimeout(handle);
    vi.advanceTimersByTime(1000);

    expect(callback).not.toHaveBeenCalled();
  });

  it('runs a frame request once, before the next paint', () => {
    const callback = vi.fn();

    systemChartTimers.requestFrame(callback);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('does not run a frame request that was cancelled', () => {
    const callback = vi.fn();

    const handle = systemChartTimers.requestFrame(callback);
    systemChartTimers.cancelFrame(handle);
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });

  it('runs an interval again and again', () => {
    const callback = vi.fn();

    const handle = systemChartTimers.setInterval(callback, 500);
    vi.advanceTimersByTime(1500);
    systemChartTimers.clearInterval(handle);

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('stops an interval that was cleared', () => {
    const callback = vi.fn();

    const handle = systemChartTimers.setInterval(callback, 500);
    vi.advanceTimersByTime(500);
    systemChartTimers.clearInterval(handle);
    vi.advanceTimersByTime(1500);

    expect(callback).toHaveBeenCalledOnce();
  });
});
