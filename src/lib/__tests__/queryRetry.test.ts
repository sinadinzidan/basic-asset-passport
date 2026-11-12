import { describe, expect, it } from 'vitest';

import {
  QUERY_MAX_RETRIES,
  QUERY_RETRY_BASE_DELAY_MS,
  QUERY_RETRY_MAX_DELAY_MS,
} from '../../constants/query';
import { createQueryRetryDelay, getQueryRetryDelayMs, shouldRetryQuery } from '../queryRetry';

describe(shouldRetryQuery.name, () => {
  it.each([429, 502, 503, 504])('retries a %i response', (status) => {
    expect(shouldRetryQuery(0, { status })).toBe(true);
  });

  it.each([400, 401, 403, 404])('does not retry a %i response', (status) => {
    expect(shouldRetryQuery(0, { status })).toBe(false);
  });

  it('does not retry errors without a status', () => {
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(false);
    expect(shouldRetryQuery(0, 'text')).toBe(false);
    expect(shouldRetryQuery(0, null)).toBe(false);
  });

  it('stops after the maximum number of retries', () => {
    expect(shouldRetryQuery(QUERY_MAX_RETRIES - 1, { status: 429 })).toBe(true);
    expect(shouldRetryQuery(QUERY_MAX_RETRIES, { status: 429 })).toBe(false);
  });
});

describe(createQueryRetryDelay.name, () => {
  it('waits up to the base delay before the first retry', () => {
    expect(createQueryRetryDelay(() => 1)(0)).toBe(QUERY_RETRY_BASE_DELAY_MS);
  });

  it('doubles the upper bound on each attempt', () => {
    expect(createQueryRetryDelay(() => 1)(2)).toBe(QUERY_RETRY_BASE_DELAY_MS * 4);
  });

  it('applies jitter between zero and the upper bound', () => {
    expect(createQueryRetryDelay(() => 0)(1)).toBe(0);
    expect(createQueryRetryDelay(() => 0.5)(1)).toBe(QUERY_RETRY_BASE_DELAY_MS);
  });

  it('never exceeds the maximum delay', () => {
    expect(createQueryRetryDelay(() => 1)(20)).toBe(QUERY_RETRY_MAX_DELAY_MS);
  });

  it('the shared delay function uses Math.random and stays within bounds', () => {
    const delay = getQueryRetryDelayMs(0);

    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(QUERY_RETRY_BASE_DELAY_MS);
  });
});
