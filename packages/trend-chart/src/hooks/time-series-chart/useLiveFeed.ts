import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';

import { LIVE_INTERVAL_MS } from '../../constants/timeSeriesChart';
import { appendPoint, simulateNextPoint } from '../../lib/time-series-chart/live';
import type { TimeSeriesPoint } from '../../types/timeSeriesChart';

import { useChartTimers } from './useChartTimers';

interface UseLiveFeedInput {
  isEnabled: boolean;
  /** The readings of each series as loaded (in the series' own unit), so the feed can continue them; read at each tick. */
  basePointsReference: RefObject<Readonly<Record<string, readonly TimeSeriesPoint[]>>>;
}

export interface LiveFeed {
  appended: Readonly<Record<string, readonly TimeSeriesPoint[]>>;
  stop: () => void;
}

const NO_APPENDED: Readonly<Record<string, readonly TimeSeriesPoint[]>> = {};

/**
 * The simulated live feed: while it plays it appends one generated reading per series every second, and nothing moves until it is
 * played. Nothing here talks to a real source; the chart labels the readings as simulated.
 */
export function useLiveFeed({ isEnabled, basePointsReference }: UseLiveFeedInput): LiveFeed {
  const timers = useChartTimers();
  const [appended, setAppended] = useState<Readonly<Record<string, readonly TimeSeriesPoint[]>>>(
    {},
  );

  const stop = useCallback((): void => setAppended({}), []);

  useEffect(() => {
    if (!isEnabled) return undefined;
    const handle = timers.setInterval(() => {
      setAppended((previous) => {
        const next: Record<string, readonly TimeSeriesPoint[]> = { ...previous };
        for (const [seriesId, base] of Object.entries(basePointsReference.current ?? {})) {
          const history = [...base, ...(previous[seriesId] ?? [])];
          const point = simulateNextPoint(seriesId, history);
          if (point) next[seriesId] = appendPoint(previous[seriesId] ?? [], point);
        }
        return next;
      });
    }, LIVE_INTERVAL_MS);
    return () => timers.clearInterval(handle);
  }, [isEnabled, timers, basePointsReference]);

  return { appended: isEnabled ? appended : NO_APPENDED, stop };
}
