import type { HostAppAPI } from '@cognite/app-sdk';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HostConnection } from '../../../types/host';
import { useHostConnection } from '../useHostConnection';

describe(useHostConnection.name, () => {
  it('has no host state before anything connects', () => {
    const connectToHost = vi.fn(() => Promise.resolve(makeConnection()));

    const { result } = renderHook(() => useHostConnection(connectToHost));

    expect(result.current.hostState).toBeNull();
    expect(connectToHost).not.toHaveBeenCalled();
  });

  it('exposes the api and the initial state once connected', async () => {
    const connection = makeConnection('{"searchQuery":"pump"}');
    const { result } = renderHook(() => useHostConnection(() => Promise.resolve(connection)));

    let connected: HostConnection | undefined;

    await act(async () => {
      connected = await result.current.getHostConnection();
    });

    expect(connected).toBe(connection);
    expect(result.current.hostState).toEqual({
      api: connection.api,
      initialState: '{"searchQuery":"pump"}',
    });
  });

  it('connects to the host only once however often it is asked', async () => {
    const connectToHost = vi.fn(() => Promise.resolve(makeConnection()));
    const { result } = renderHook(() => useHostConnection(connectToHost));

    await act(async () => {
      await Promise.all([result.current.getHostConnection(), result.current.getHostConnection()]);
    });

    expect(connectToHost).toHaveBeenCalledTimes(1);
  });

  it('passes a failed connection on and keeps the host state empty', async () => {
    const failure = new Error('no host');
    const { result } = renderHook(() => useHostConnection(() => Promise.reject(failure)));

    await act(async () => {
      await expect(result.current.getHostConnection()).rejects.toBe(failure);
    });

    expect(result.current.hostState).toBeNull();
  });
});

function makeConnection(initialState?: string): HostConnection {
  const api = { syncInternalState: vi.fn() } as Partial<HostAppAPI> as HostAppAPI;

  return initialState === undefined ? { api } : { api, initialState };
}
