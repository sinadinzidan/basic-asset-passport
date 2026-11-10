import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  TREND_GRANULARITY,
  TREND_QUERY_STALE_TIME_MS,
  TREND_WINDOW_MS,
} from '../../constants/timeseries';
import { getTimeseriesKey } from '../../lib/timeseriesProperties';
import type {
  TimeseriesIdentifier,
  TimeseriesTrend,
} from '../../types/timeseries';

import { useTimeseriesDatapointsClient } from './useTimeseriesDatapointsClient';

const defaultDeps = { useTimeseriesDatapointsClient, now: () => Date.now() };

export type UseTimeseriesTrendsContextType = typeof defaultDeps;
export const UseTimeseriesTrendsContext =
  createContext<UseTimeseriesTrendsContextType>(defaultDeps);

export { getTimeseriesKey };

/**
 * The last six months of readings for the series, fetched together in one batch and
 * keyed by `getTimeseriesKey`. Nothing is fetched for an empty list.
 */
export function useTimeseriesTrends(identifiers: TimeseriesIdentifier[]) {
  const { useTimeseriesDatapointsClient: useClient, now } = useContext(
    UseTimeseriesTrendsContext,
  );
  const client = useClient();

  return useQuery({
    queryKey: [
      'timeseries-trends',
      client.project,
      TREND_GRANULARITY,
      identifiers.map(getTimeseriesKey).sort(),
    ],
    queryFn: async (): Promise<Map<string, TimeseriesTrend['points']>> => {
      const to = now();
      const trends = await client.getTrends(identifiers, {
        from: to - TREND_WINDOW_MS,
        to,
        granularity: TREND_GRANULARITY,
      });

      return new Map(
        trends.map((trend) => [getTimeseriesKey(trend), trend.points]),
      );
    },
    enabled: identifiers.length > 0,
    staleTime: TREND_QUERY_STALE_TIME_MS,
  });
}
