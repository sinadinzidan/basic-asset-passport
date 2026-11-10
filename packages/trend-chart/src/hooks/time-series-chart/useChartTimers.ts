import { createContext, useContext } from 'react';

/** The timers the live feed uses, injected so tests can drive them. */
export interface ChartTimers {
  setInterval: (callback: () => void, delayMs: number) => number;
  clearInterval: (handle: number) => void;
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (handle: number) => void;
}

export const systemChartTimers: ChartTimers = {
  setInterval: (callback, delayMs) => window.setInterval(callback, delayMs),
  clearInterval: (handle) => window.clearInterval(handle),
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (handle) => window.clearTimeout(handle),
};

export const ChartTimersContext = createContext<ChartTimers>(systemChartTimers);

export function useChartTimers(): ChartTimers {
  return useContext(ChartTimersContext);
}
