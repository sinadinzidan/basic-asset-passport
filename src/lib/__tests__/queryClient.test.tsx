import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { QUERY_MAX_RETRIES } from '../../constants/query';
import { createQueryClient, shouldRetryQuery } from '../queryClient';

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

describe('shouldRetryQuery', () => {
  it.each([400, 401, 403, 404, 429])('fails at once on HTTP %i, which a retry cannot fix', (status) => {
    expect(shouldRetryQuery(0, new HttpError(status))).toBe(false);
  });

  it.each([408, 500, 502, 503, 504])('retries HTTP %i, which can be transient', (status) => {
    expect(shouldRetryQuery(0, new HttpError(status))).toBe(true);
  });

  it('retries a lost connection', () => {
    expect(shouldRetryQuery(0, new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not retry our own errors, such as an unexpected response shape', () => {
    expect(shouldRetryQuery(0, new Error('Invalid name property on space/node.'))).toBe(false);
    expect(shouldRetryQuery(0, undefined)).toBe(false);
  });

  it('stops after the maximum number of retries', () => {
    expect(shouldRetryQuery(QUERY_MAX_RETRIES - 1, new HttpError(503))).toBe(true);
    expect(shouldRetryQuery(QUERY_MAX_RETRIES, new HttpError(503))).toBe(false);
  });
});

describe('createQueryClient', () => {
  function renderFailingQuery(queryFn: () => Promise<never>) {
    const client = createQueryClient(() => 0);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return renderHook(() => useQuery({ queryKey: ['assets'], queryFn }), { wrapper });
  }

  it('shows a permission error after a single request', async () => {
    const queryFn = vi.fn<() => Promise<never>>(() => Promise.reject(new HttpError(403)));
    const { result } = renderFailingQuery(queryFn);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('retries a server error up to the maximum before showing it', async () => {
    const queryFn = vi.fn<() => Promise<never>>(() => Promise.reject(new HttpError(503)));
    const { result } = renderFailingQuery(queryFn);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryFn).toHaveBeenCalledTimes(QUERY_MAX_RETRIES + 1);
  });
});
