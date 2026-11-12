import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { assert, describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { LIVE_INTERVAL_MS, LIVE_STEP_MS } from '../../../constants/timeSeriesChart';
import { createPoints } from '../../../mocks/chartData';
import type { TimeSeriesPoint } from '../../../types/timeSeriesChart';
import { ChartTimersContext } from '../useChartTimers';
import type { ChartTimers } from '../useChartTimers';
import { useLiveFeed } from '../useLiveFeed';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
/** Three readings a minute apart, the last one two minutes in. */
const LOADED = { s1: createPoints([10, 12, 14]) };
const LAST_LOADED_AT = 2 * MINUTE_MS;

type BasePoints = Readonly<Record<string, readonly TimeSeriesPoint[]>>;

describe(useLiveFeed.name, () => {
  it('sets no timer and appends nothing while it is not playing', () => {
    const { result, manual } = renderFeed({ isEnabled: false });

    expect(manual.activeCount()).toBe(0);
    expect(result.current.appended).toEqual({});
  });

  it('ticks once a second while it plays', () => {
    const { manual } = renderFeed();

    expect(manual.delays).toEqual([LIVE_INTERVAL_MS]);
  });

  it('appends nothing before the first tick', () => {
    const { result } = renderFeed();

    expect(result.current.appended).toEqual({});
  });

  it('appends one reading to each series at a tick, a step after its last', () => {
    const { result, manual } = renderFeed({
      base: { s1: createPoints([10, 12, 14]), s2: createPoints([1, 2]) },
    });

    act(() => manual.tick());

    expect(timestampsOf(result.current.appended.s1)).toEqual([LAST_LOADED_AT + LIVE_STEP_MS]);
    expect(timestampsOf(result.current.appended.s2)).toEqual([MINUTE_MS + LIVE_STEP_MS]);
  });

  it('continues from what it appended at the tick before', () => {
    const { result, manual } = renderFeed();

    act(() => manual.tick());
    act(() => manual.tick());

    expect(timestampsOf(result.current.appended.s1)).toEqual([
      LAST_LOADED_AT + LIVE_STEP_MS,
      LAST_LOADED_AT + 2 * LIVE_STEP_MS,
    ]);
  });

  it('appends a number, never a missing reading', () => {
    const { result, manual } = renderFeed();

    act(() => manual.tick());

    expect(result.current.appended.s1?.[0]?.value).toEqual(expect.any(Number));
  });

  it('appends nothing to a series without a valid reading to continue from', () => {
    const { result, manual } = renderFeed({ base: { s1: createPoints([null, null]) } });

    act(() => manual.tick());

    expect(result.current.appended).toEqual({});
  });

  it('reads the loaded readings anew at each tick', () => {
    const reference: { current: BasePoints } = { current: {} };
    const { result, manual } = renderFeed({ reference });

    reference.current = LOADED;
    act(() => manual.tick());

    expect(timestampsOf(result.current.appended.s1)).toEqual([LAST_LOADED_AT + LIVE_STEP_MS]);
  });

  it('clears its timer and shows nothing appended once it is paused', () => {
    const { result, manual, rerender } = renderFeed();
    act(() => manual.tick());

    rerender({ isEnabled: false });

    expect(manual.activeCount()).toBe(0);
    expect(result.current.appended).toEqual({});
  });

  it('forgets what it appended when it is stopped', () => {
    const { result, manual } = renderFeed();
    act(() => manual.tick());

    act(() => result.current.stop());

    expect(result.current.appended).toEqual({});
  });

  it('clears its timer when the chart goes away', () => {
    const { manual, unmount } = renderFeed();

    unmount();

    expect(manual.activeCount()).toBe(0);
  });
});

function renderFeed(
  options: { isEnabled?: boolean; base?: BasePoints; reference?: { current: BasePoints } } = {},
) {
  const manual = createManualTimers();
  const basePointsReference = options.reference ?? { current: options.base ?? LOADED };
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChartTimersContext.Provider value={manual.timers}>{children}</ChartTimersContext.Provider>
  );
  const rendered = renderHook(({ isEnabled }) => useLiveFeed({ isEnabled, basePointsReference }), {
    wrapper,
    initialProps: { isEnabled: options.isEnabled ?? true },
  });
  return { ...rendered, manual };
}

/** Intervals the test runs by hand; the feed sets no timeout, so asking for one fails the test. */
function createManualTimers() {
  const callbacks = new Map<number, () => void>();
  const delays: number[] = [];
  let nextHandle = 1;
  const timers: ChartTimers = {
    setInterval: (callback, delayMs) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      delays.push(delayMs);
      return handle;
    },
    clearInterval: (handle) => {
      callbacks.delete(handle);
    },
    setTimeout: () => assert.fail('The live feed sets no timeout'),
    clearTimeout: () => assert.fail('The live feed clears no timeout'),
    requestFrame: () => assert.fail('The live feed asks for no frame'),
    cancelFrame: () => assert.fail('The live feed cancels no frame'),
  };
  return {
    timers,
    delays,
    tick: (): void => callbacks.forEach((callback) => callback()),
    activeCount: (): number => callbacks.size,
  };
}

function timestampsOf(points: readonly TimeSeriesPoint[] | undefined): number[] {
  return (points ?? []).map((point) => point.timestamp);
}
