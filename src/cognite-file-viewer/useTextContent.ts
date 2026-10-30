import { useEffect, useState } from 'react';

import { TEXT_PREVIEW_MAX_CHARS } from '../constants/fileViewer';

type TextResult = { source: string; content?: string; isTruncated?: boolean; error?: Error };

// Downloads `url` as text; aborts the request when `url` changes or on unmount, and never shows the text of an earlier url.
export function useTextContent(url: string) {
  const [result, setResult] = useState<TextResult>();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const isTruncated = text.length > TEXT_PREVIEW_MAX_CHARS;
        setResult({ source: url, content: isTruncated ? text.slice(0, TEXT_PREVIEW_MAX_CHARS) : text, isTruncated });
      })
      .catch((err) => {
        if (!cancelled) setResult({ source: url, error: err instanceof Error ? err : new Error(String(err)) });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  const current = result?.source === url ? result : undefined;
  return { content: current?.content ?? null, isTruncated: current?.isTruncated ?? false, error: current?.error ?? null };
}
