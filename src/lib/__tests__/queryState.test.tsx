import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeQueryClientWrapper } from '../../__mocks__/QueryClientWrapper';
import { toQueryState } from '../queryState';

function useNarrowQuery(read: () => Promise<string>, limit: number = 1) {
  return toQueryState(
    useQuery({
      queryKey: ['narrow', limit],
      queryFn: read,
      placeholderData: (previous: string | undefined) => previous,
    }),
  );
}

describe(toQueryState.name, () => {
  it('is pending without data until the answer arrives', async () => {
    const { result } = renderHook(() => useNarrowQuery(() => Promise.resolve('answer')), {
      wrapper: makeQueryClientWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data).toBe('answer'));
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('gives the error of a failed read and reads again on retry', async () => {
    const read = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('no access'))
      .mockResolvedValue('answer');
    const { result } = renderHook(() => useNarrowQuery(read), {
      wrapper: makeQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.data).toBe('answer'));
  });

  it('says it is loading more while it shows the earlier answer for a longer read', async () => {
    const read = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockReturnValue(new Promise(() => {}));
    const { result, rerender } = renderHook(({ limit }) => useNarrowQuery(read, limit), {
      wrapper: makeQueryClientWrapper(),
      initialProps: { limit: 1 },
    });

    await waitFor(() => expect(result.current.data).toBe('first'));
    expect(result.current.isLoadingMore).toBe(false);

    rerender({ limit: 2 });

    await waitFor(() => expect(result.current.isLoadingMore).toBe(true));
    expect(result.current.data).toBe('first');
    expect(result.current.isFetching).toBe(true);
  });

  it('exposes nothing of the query beyond its narrow state', async () => {
    const { result } = renderHook(() => useNarrowQuery(() => Promise.resolve('answer')), {
      wrapper: makeQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(Object.keys(result.current).sort()).toEqual([
      'data',
      'error',
      'isError',
      'isFetching',
      'isLoadingMore',
      'isPending',
      'retry',
    ]);
  });
});
