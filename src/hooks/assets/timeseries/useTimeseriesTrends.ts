import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  TREND_GRANULARITY,
  TREND_QUERY_STALE_TIME_MS,
  TREND_WINDOW_MS,
} from '../../../constants/timeseries';
import { toQueryState } from '../../../lib/queryState';
import { getTimeseriesKey } from '../../../lib/timeseriesProperties';
import type { TimeseriesIdentifier, TimeseriesTrend } from '../../../types/timeseries';

import { useTimeseriesClient } from './useTimeseriesClient';

const defaultDeps = { now: () => Date.now() };

type UseTimeseriesTrendsContextType = typeof defaultDeps;
export const UseTimeseriesTrendsContext =
  createContext<UseTimeseriesTrendsContextType>(defaultDeps);

export function useTimeseriesTrends(identifiers: TimeseriesIdentifier[]) {
  const { now } = useContext(UseTimeseriesTrendsContext);
  const client = useTimeseriesClient();

  const query = useQuery({
    queryKey: [
      'timeseries-trends',
      client.project,
      TREND_GRANULARITY,
      identifiers.map(getTimeseriesKey).sort(),
    ],
    queryFn: async (): Promise<Map<string, TimeseriesTrend>> => {
      const to = now();
      const trends = await client.getTrends(identifiers, {
        from: to - TREND_WINDOW_MS,
        to,
        granularity: TREND_GRANULARITY,
      });

      return new Map(trends.map((trend) => [getTimeseriesKey(trend), trend]));
    },
    enabled: identifiers.length > 0,
    staleTime: TREND_QUERY_STALE_TIME_MS,
  });

  return toQueryState(query);
}
