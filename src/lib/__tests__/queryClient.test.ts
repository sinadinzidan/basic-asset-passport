import { describe, expect, it } from 'vitest';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '../../constants/query';
import { createAppQueryClient } from '../queryClient';
import { getQueryRetryDelayMs, shouldRetryQuery } from '../queryRetry';

describe(createAppQueryClient.name, () => {
  it('caches query results for the configured times', () => {
    const queries = createAppQueryClient().getDefaultOptions().queries;

    expect(queries?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(queries?.gcTime).toBe(QUERY_GC_TIME_MS);
  });

  it('retries throttled requests with exponential backoff and jitter', () => {
    const queries = createAppQueryClient().getDefaultOptions().queries;

    expect(queries?.retry).toBe(shouldRetryQuery);
    expect(queries?.retryDelay).toBe(getQueryRetryDelayMs);
  });
});
