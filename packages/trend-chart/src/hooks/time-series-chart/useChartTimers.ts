import { createContext, useContext } from 'react';

/** The timers the chart uses (the live feed, the sidebar and the crosshair), injected so tests can drive them. */
export interface ChartTimers {
  setInterval: (callback: () => void, delayMs: number) => number;
  clearInterval: (handle: number) => void;
  setTimeout: (callback: () => void, delayMs: number) => number;
  clearTimeout: (handle: number) => void;
  /** Runs the callback before the next paint, so work tied to the pointer happens once per frame. */
  requestFrame: (callback: () => void) => number;
  cancelFrame: (handle: number) => void;
}

export const systemChartTimers: ChartTimers = {
  setInterval: (callback, delayMs) => window.setInterval(callback, delayMs),
  clearInterval: (handle) => window.clearInterval(handle),
  setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
  clearTimeout: (handle) => window.clearTimeout(handle),
  requestFrame: (callback) => window.requestAnimationFrame(() => callback()),
  cancelFrame: (handle) => window.cancelAnimationFrame(handle),
};

export const ChartTimersContext = createContext<ChartTimers>(systemChartTimers);

export function useChartTimers(): ChartTimers {
  return useContext(ChartTimersContext);
}
