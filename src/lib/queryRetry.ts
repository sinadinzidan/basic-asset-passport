import {
  QUERY_MAX_RETRIES,
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

// Only throttling and temporary gateway failures are retried. A 4xx such as
// 401 or 404 would fail again, so it is shown to the user straight away.
export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  return (
    failureCount < QUERY_MAX_RETRIES &&
    hasStatus(error) &&
    RETRYABLE_HTTP_STATUSES.includes(error.status)
  );
}

// Exponential backoff with full jitter: a random wait between zero and a
// ceiling that doubles with each attempt, so parallel clients do not retry together.
// TanStack Query calls the delay with (failureCount, error), so the random source
// is fixed by this factory rather than passed as a second argument.
export function createQueryRetryDelay(
  random: () => number,
): (failureCount: number) => number {
  return (failureCount) => {
    const ceilingMs = Math.min(
      QUERY_RETRY_MAX_DELAY_MS,
      QUERY_RETRY_BASE_DELAY_MS * 2 ** failureCount,
    );
    return Math.floor(random() * ceilingMs);
  };
}

export const getQueryRetryDelayMs = createQueryRetryDelay(Math.random);
