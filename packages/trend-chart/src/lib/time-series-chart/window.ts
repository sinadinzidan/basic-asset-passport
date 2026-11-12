import { MILLISECONDS_PER_MINUTE } from '../../constants/monitoring';
import type { ChartConfiguration } from '../../types/timeSeriesChart';
import { resolveChartWindow } from '../monitoring/chartModel';

/** A span of time as two ISO time stamps. */
export interface IsoTimeRange {
  from: string;
  to: string;
}

/** "Now" to the minute, so a window that ends at now keeps one identity (and one request) for the minute instead of changing on every render. */
export function nowToMinuteMs(nowIso: string): number {
  return Math.floor(new Date(nowIso).getTime() / MILLISECONDS_PER_MINUTE) * MILLISECONDS_PER_MINUTE;
}

/** The window a configuration shows at `nowMs`. */
export function chartWindowOf(configuration: ChartConfiguration, nowMs: number): IsoTimeRange {
  const custom = configuration.window
    ? { fromMs: configuration.window.start, toMs: configuration.window.end }
    : undefined;
  const resolved = resolveChartWindow(configuration.range, nowMs, custom);
  return {
    from: new Date(resolved.fromMs).toISOString(),
    to: new Date(resolved.toMs).toISOString(),
  };
}
