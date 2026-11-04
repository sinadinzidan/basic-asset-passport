import { QueryClient } from '@tanstack/react-query';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '../constants/query';

import { getQueryRetryDelayMs, shouldRetryQuery } from './queryRetry';

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: shouldRetryQuery,
        retryDelay: getQueryRetryDelayMs,
      },
    },
  });
}
