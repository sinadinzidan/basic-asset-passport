import {
  QUERY_MAX_RETRIES,
  QUERY_RETRY_BACKOFF_FACTOR,
  QUERY_RETRY_BASE_DELAY_MS,
  QUERY_RETRY_MAX_DELAY_MS,
  RETRYABLE_HTTP_STATUSES,
} from '../constants/query';

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return (
    failureCount < QUERY_MAX_RETRIES &&
    hasStatus(error) &&
    RETRYABLE_HTTP_STATUSES.includes(error.status)
  );
}

export function createQueryRetryDelay(random: () => number): (failureCount: number) => number {
  return (failureCount) => {
    const ceilingMs = Math.min(
      QUERY_RETRY_MAX_DELAY_MS,
      QUERY_RETRY_BASE_DELAY_MS * QUERY_RETRY_BACKOFF_FACTOR ** failureCount,
    );
    return Math.floor(random() * ceilingMs);
  };
}

export const getQueryRetryDelayMs = createQueryRetryDelay(Math.random);
