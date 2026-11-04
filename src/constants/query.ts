export const QUERY_STALE_TIME_MS = 300_000;
export const QUERY_GC_TIME_MS = 600_000;
export const QUERY_MAX_RETRIES = 3;
export const QUERY_RETRY_BASE_DELAY_MS = 1_000;
export const QUERY_RETRY_MAX_DELAY_MS = 15_000;
export const RETRYABLE_HTTP_STATUSES: readonly number[] = [429, 502, 503, 504];
