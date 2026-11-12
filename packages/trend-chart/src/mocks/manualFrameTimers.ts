import { assert } from 'vitest';

import type { ChartTimers } from '../hooks/time-series-chart/useChartTimers';

/** Animation frames the test runs by hand; any other timer fails the test. */
export function createManualFrameTimers() {
  const callbacks = new Map<number, () => void>();
  let nextHandle = 1;
  const timers: ChartTimers = {
    requestFrame: (callback) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
    cancelFrame: (handle) => {
      callbacks.delete(handle);
    },
    setInterval: () => assert.fail('Only frames are expected'),
    clearInterval: () => assert.fail('Only frames are expected'),
    setTimeout: () => assert.fail('Only frames are expected'),
    clearTimeout: () => assert.fail('Only frames are expected'),
  };
  return {
    timers,
    pendingCount: (): number => callbacks.size,
    runFrame: (): void => {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback());
    },
  };
}
