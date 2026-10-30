import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBlobUrl } from '../useBlobUrl';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useBlobUrl', () => {
  it('exposes an object URL once the file is downloaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['image']))));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file-1');

    const { result } = renderHook(() => useBlobUrl('https://files.test/a.png'));

    expect(result.current.blobUrl).toBeUndefined();
    await waitFor(() => expect(result.current.blobUrl).toBe('blob:file-1'));
    expect(result.current.error).toBeUndefined();
  });

  it('reports non-OK responses as errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })));

    const { result } = renderHook(() => useBlobUrl('https://files.test/a.png'));

    await waitFor(() => expect(result.current.error?.message).toBe('HTTP 403'));
    expect(result.current.blobUrl).toBeUndefined();
  });

  it('aborts the request and revokes the object URL on unmount', async () => {
    let signal: AbortSignal | null | undefined;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      signal = init?.signal;
      return new Response(new Blob(['image']));
    }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:file-2');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const { result, unmount } = renderHook(() => useBlobUrl('https://files.test/a.png'));
    await waitFor(() => expect(result.current.blobUrl).toBe('blob:file-2'));
    unmount();

    expect(signal?.aborted).toBe(true);
    expect(revoke).toHaveBeenCalledWith('blob:file-2');
  });

  it('does not expose the previous file while a new url loads', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['image']))));
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');

    const { result, rerender } = renderHook(({ url }) => useBlobUrl(url), { initialProps: { url: 'https://files.test/a.png' } });
    await waitFor(() => expect(result.current.blobUrl).toBe('blob:first'));
    rerender({ url: 'https://files.test/b.png' });

    expect(result.current.blobUrl).toBeUndefined();
    await waitFor(() => expect(result.current.blobUrl).toBe('blob:second'));
  });
});
