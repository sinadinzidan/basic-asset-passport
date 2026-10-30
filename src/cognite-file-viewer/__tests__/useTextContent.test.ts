import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEXT_PREVIEW_MAX_CHARS } from '../../constants/fileViewer';
import { useTextContent } from '../useTextContent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTextContent', () => {
  it('returns the downloaded text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Equipment P-101')));

    const { result } = renderHook(() => useTextContent('https://files.test/a.txt'));

    expect(result.current.content).toBeNull();
    await waitFor(() => expect(result.current.content).toBe('Equipment P-101'));
    expect(result.current.error).toBeNull();
  });

  it('reports non-OK responses as errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));

    const { result } = renderHook(() => useTextContent('https://files.test/a.txt'));

    await waitFor(() => expect(result.current.error?.message).toBe('HTTP 404'));
    expect(result.current.content).toBeNull();
  });

  it('wraps non-Error rejections in an Error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'offline'; }));

    const { result } = renderHook(() => useTextContent('https://files.test/a.txt'));

    await waitFor(() => expect(result.current.error?.message).toBe('offline'));
  });

  it('ignores a response that arrives after unmount', async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; })));

    const { result, unmount } = renderHook(() => useTextContent('https://files.test/a.txt'));
    unmount();
    resolveFetch(new Response('late'));
    await Promise.resolve();

    expect(result.current.content).toBeNull();
  });

  it('cuts a very large file and says so', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x'.repeat(TEXT_PREVIEW_MAX_CHARS + 10))));

    const { result } = renderHook(() => useTextContent('https://files.test/big.txt'));

    await waitFor(() => expect(result.current.content).toHaveLength(TEXT_PREVIEW_MAX_CHARS));
    expect(result.current.isTruncated).toBe(true);
  });

  it('never shows the text or error of an earlier file after the url changes', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.endsWith('bad.txt') ? new Response('', { status: 500 }) : new Response('first'))));

    const { result, rerender } = renderHook(({ url }) => useTextContent(url), { initialProps: { url: 'https://files.test/a.txt' } });
    await waitFor(() => expect(result.current.content).toBe('first'));

    rerender({ url: 'https://files.test/bad.txt' });
    expect(result.current.content).toBeNull();
    await waitFor(() => expect(result.current.error?.message).toBe('HTTP 500'));

    rerender({ url: 'https://files.test/b.txt' });
    expect(result.current.error).toBeNull();
  });

  it('aborts the request when the url changes or the viewer closes', async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      if (init?.signal) signals.push(init.signal);
      return new Promise<Response>(() => undefined);
    }));

    const { unmount } = renderHook(() => useTextContent('https://files.test/a.txt'));
    unmount();

    expect(signals[0]?.aborted).toBe(true);
  });
});
