import type { CogniteClient, FileInfo } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../__mocks__/cogniteClient';
import { clearAllFileCache } from '../fileResolution';
import type { FileSource } from '../types';
import { useFileResolver } from '../useFileResolver';

function makeFile(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    id: 7,
    name: 'manual.pdf',
    mimeType: 'application/pdf',
    uploaded: true,
    createdTime: new Date(0),
    lastUpdatedTime: new Date(0),
    ...overrides,
  };
}

const linkResponse = {
  data: { items: [{ downloadUrl: 'https://files.test/7' }] },
  status: 200,
  headers: {},
};

describe('useFileResolver', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
    clearAllFileCache();
  });

  it('returns a URL source as it is, reading the type from the URL', async () => {
    const source: FileSource = { type: 'url', url: 'https://files.test/photo.png' };

    const { result } = renderHook(() => useFileResolver(source));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toEqual({
      url: 'https://files.test/photo.png',
      mimeType: 'image/png',
      isLoading: false,
      error: null,
    });
  });

  it('keeps the type a URL source states, and has none when it cannot tell', async () => {
    const stated: FileSource = { type: 'url', url: 'https://files.test/x', mimeType: 'text/csv' };
    const unknown: FileSource = { type: 'url', url: 'https://files.test/x' };

    const first = renderHook(() => useFileResolver(stated));
    const second = renderHook(() => useFileResolver(unknown));

    await waitFor(() => expect(first.result.current.mimeType).toBe('text/csv'));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(second.result.current.mimeType).toBe('');
  });

  it('is loading until a CDF file is resolved', () => {
    vi.spyOn(client.files, 'retrieve').mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }, client));

    expect(result.current).toEqual({ isLoading: true, error: null });
  });

  it('resolves a file by its internal ID', async () => {
    const retrieve = vi.spyOn(client.files, 'retrieve').mockResolvedValue([makeFile()]);
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse);

    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }, client));

    await waitFor(() => expect(result.current.url).toBe('https://files.test/7'));
    expect(retrieve).toHaveBeenCalledWith([{ id: 7 }]);
    expect(result.current.mimeType).toBe('application/pdf');
    expect(result.current.instanceId).toBeUndefined();
  });

  it('resolves a file by its instance ID and keeps that ID', async () => {
    const retrieve = vi.spyOn(client.files, 'retrieve').mockResolvedValue([makeFile()]);
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse);
    const source: FileSource = { type: 'instanceId', space: 'files', externalId: 'doc-1' };

    const { result } = renderHook(() => useFileResolver(source, client));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(retrieve).toHaveBeenCalledWith([
      { instanceId: { space: 'files', externalId: 'doc-1' } },
    ]);
    expect(result.current.instanceId).toEqual({ space: 'files', externalId: 'doc-1' });
  });

  it('prefers the instance ID CDF returns for the file', async () => {
    vi.spyOn(client.files, 'retrieve').mockResolvedValue([
      makeFile({ instanceId: { space: 'real', externalId: 'real-1' } }),
    ]);
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse);

    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }, client));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.instanceId).toEqual({ space: 'real', externalId: 'real-1' });
  });

  it('reports that a CDF file needs a client', async () => {
    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe(
      'CogniteClient is required for instanceId and internalId sources',
    );
  });

  it('reports why a file could not be read', async () => {
    vi.spyOn(client.files, 'retrieve').mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }, client));

    await waitFor(() => expect(result.current.error?.message).toBe('no access'));
  });

  it('turns a failure that is not an error into one', async () => {
    vi.spyOn(client.files, 'retrieve').mockRejectedValue('offline');

    const { result } = renderHook(() => useFileResolver({ type: 'internalId', id: 7 }, client));

    await waitFor(() => expect(result.current.error?.message).toBe('offline'));
  });

  it('resolves again when the source changes, ignoring the earlier answer', async () => {
    const retrieve = vi
      .spyOn(client.files, 'retrieve')
      .mockResolvedValueOnce([makeFile({ id: 7 })])
      .mockResolvedValueOnce([makeFile({ id: 8, name: 'photo.png', mimeType: 'image/png' })]);
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse);

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useFileResolver({ type: 'internalId', id }, client),
      { initialProps: { id: 7 } },
    );
    rerender({ id: 8 });

    await waitFor(() => expect(result.current.mimeType).toBe('image/png'));
    expect(retrieve).toHaveBeenCalledTimes(2);
  });
});
