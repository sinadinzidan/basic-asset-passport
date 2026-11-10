import type { UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { SeriesSearchPage } from '../../types/timeSeriesChart';
import { QUERY_ROOT } from '../core/queryRoot';

import { useChartAdapter, useChartScopeKey } from './useChartAdapter';

/**
 * The series the Add Data panel lists for a query: the first `limit` matches and how many match in all. The key carries the
 * data source, the query text and the limit, so results of one search never answer another; an empty query lists everything the user
 * may add. While a longer page loads the shorter one stays on screen.
 */
export function useSeriesSearch(query: string, limit: number): UseQueryResult<SeriesSearchPage> {
  const adapter = useChartAdapter();
  const scopeKey = useChartScopeKey();
  return useQuery({
    queryKey: [QUERY_ROOT, 'time-series-chart', scopeKey, 'series-search', query, limit],
    queryFn: () => adapter.searchSeries(query, { limit }),
    placeholderData: keepPreviousData,
  });
}
