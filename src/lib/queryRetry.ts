import {
  QUERY_MAX_RETRIES,
  QUERY_RETRY_BACKOFF_FACTOR,
  QUERY_RETRY_BASE_DELAY_MS,
  QUERY_RETRY_MAX_DELAY_MS,
  RETRYABLE_HTTP_STATUSES,
  RETRY_AFTER_HEADER,
} from '../constants/query';
import { MS_PER_SECOND } from '../constants/time';
import { RetryAfterErrorSchema } from '../schemas/httpError';

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

export function createQueryRetryDelay(
  random: () => number,
): (failureCount: number, error?: unknown) => number {
  return (failureCount, error) => {
    const ceilingMs = Math.min(
      QUERY_RETRY_MAX_DELAY_MS,
      QUERY_RETRY_BASE_DELAY_MS * QUERY_RETRY_BACKOFF_FACTOR ** failureCount,
    );
    const backoffMs = Math.floor(random() * ceilingMs);

    return Math.min(QUERY_RETRY_MAX_DELAY_MS, Math.max(backoffMs, readRetryAfterMs(error)));
  };
}

function readRetryAfterMs(error: unknown): number {
  const headers = RetryAfterErrorSchema.safeParse(error);
  if (!headers.success) return 0;

  const [, retryAfter] =
    Object.entries(headers.data.headers).find(
      ([name]) => name.toLowerCase() === RETRY_AFTER_HEADER,
    ) ?? [];
  const seconds = Number(retryAfter);

  return Number.isFinite(seconds) && seconds > 0 ? seconds * MS_PER_SECOND : 0;
}

export const getQueryRetryDelayMs = createQueryRetryDelay(Math.random);
