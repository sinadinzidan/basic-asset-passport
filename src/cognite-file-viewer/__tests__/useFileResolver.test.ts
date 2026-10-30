import { CogniteClient } from '@cognite/sdk';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAllFileCache } from '../fileResolution';
import type { FileSource } from '../types';
import { useFileResolver } from '../useFileResolver';

afterEach(() => {
  vi.restoreAllMocks();
  clearAllFileCache();
});

describe('useFileResolver', () => {
  it('resolves modelled files by instance ID, not classic external ID', async () => {
    const client = createClient();
    const retrieve = vi.spyOn(client.files, 'retrieve').mockResolvedValue([{
      id: 123, name: 'PID.pdf', mimeType: 'application/pdf', uploaded: true,
      createdTime: new Date(0), lastUpdatedTime: new Date(0),
    }]);
    vi.spyOn(client, 'post').mockResolvedValue({
      status: 200, headers: {}, data: { items: [{ downloadUrl: 'https://files.test/PID.pdf' }] },
    });

    const { result } = renderHook(() => useFileResolver({ type: 'instanceId', space: 'files', externalId: 'PID-1' }, client));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(retrieve).toHaveBeenCalledWith([{ instanceId: { space: 'files', externalId: 'PID-1' } }]);
    expect(result.current).toMatchObject({
      url: 'https://files.test/PID.pdf', mimeType: 'application/pdf',
      instanceId: { space: 'files', externalId: 'PID-1' },
    });
  });

  it('reports files without content and permission failures', async () => {
    const client = createClient();
    const retrieve = vi.spyOn(client.files, 'retrieve').mockResolvedValue([]);
    const { result, rerender } = renderHook(
      ({ source }: { source: FileSource }) => useFileResolver(source, client),
      { initialProps: { source: { type: 'internalId', id: 123 } } }
    );
    await waitFor(() => expect(result.current.error?.message).toContain('not found'));
    retrieve.mockRejectedValue(new Error('Forbidden'));
    rerender({ source: { type: 'internalId', id: 456 } });
    await waitFor(() => expect(result.current.error?.message).toBe('Forbidden'));
  });

  it('supports direct URLs and rejects CDF sources without a client', async () => {
    const { result } = renderHook(() => useFileResolver({ type: 'url', url: 'https://files.test/PID.pdf' }));
    await waitFor(() => expect(result.current.url).toBe('https://files.test/PID.pdf'));
    expect(result.current.mimeType).toBe('application/pdf');
    const missingClient = renderHook(() => useFileResolver({ type: 'internalId', id: 123 }));
    await waitFor(() => expect(missingClient.result.current.error?.message).toContain('required'));
  });

  it('ignores an obsolete file request after switching files', async () => {
    const client = createClient();
    let finish: ((files: Awaited<ReturnType<typeof client.files.retrieve>>) => void) | undefined;
    vi.spyOn(client.files, 'retrieve').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    const { result, rerender } = renderHook(
      ({ source }: { source: FileSource }) => useFileResolver(source, client),
      { initialProps: { source: { type: 'internalId', id: 123 } } }
    );
    rerender({ source: { type: 'url', url: 'https://files.test/current.pdf' } });
    await waitFor(() => expect(result.current.url).toBe('https://files.test/current.pdf'));
    await act(async () => { finish?.([]); });
    expect(result.current.url).toBe('https://files.test/current.pdf');
    expect(result.current.error).toBeNull();
  });
});

function createClient(): CogniteClient {
  return new CogniteClient({ appId: 'test', project: 'test', getToken: async () => 'test' });
}
