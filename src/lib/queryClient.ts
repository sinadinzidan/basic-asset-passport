import { QueryClient } from '@tanstack/react-query';

import {
  HTTP_REQUEST_TIMEOUT,
  HTTP_SERVER_ERROR_MIN,
  QUERY_GC_TIME_MS,
  QUERY_MAX_RETRIES,
  QUERY_RETRY_BASE_DELAY_MS,
  QUERY_RETRY_MAX_DELAY_MS,
  QUERY_STALE_TIME_MS,
} from '../constants/query';

function readStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number' ? error.status : undefined;
}

function defaultRetryDelay(failureCount: number): number {
  return Math.min(QUERY_RETRY_BASE_DELAY_MS * 2 ** failureCount, QUERY_RETRY_MAX_DELAY_MS);
}

// Only failures that can succeed on a second try are retried: lost connections, request timeouts and server errors.
// Client errors (403 without access, 404, 400), our own validation errors and 429 (cdfTaskRunner already backed
// off and retried it) fail at once, so the user sees the message and Retry button instead of a long skeleton.
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= QUERY_MAX_RETRIES) return false;
  const status = readStatus(error);
  if (status === undefined) return error instanceof TypeError;
  return status === HTTP_REQUEST_TIMEOUT || status >= HTTP_SERVER_ERROR_MIN;
}

export function createQueryClient(retryDelay: (failureCount: number) => number = defaultRetryDelay): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        gcTime: QUERY_GC_TIME_MS,
        retry: shouldRetryQuery,
        retryDelay,
      },
    },
  });
}
