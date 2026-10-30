import { useEffect, useState } from 'react';

// Downloads `url` into an object URL; aborts the request and revokes the URL on unmount or when `url` changes.
export function useBlobUrl(url: string) {
  const [result, setResult] = useState<{ source: string; blobUrl?: string; error?: Error }>();

  useEffect(() => {
    let cancelled = false;

    let objectUrl: string | undefined;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const newUrl = URL.createObjectURL(blob);
        objectUrl = newUrl;
        setResult({ source: url, blobUrl: newUrl });
      })
      .catch((err) => {
        if (!cancelled) setResult({ source: url, error: err instanceof Error ? err : new Error(String(err)) });
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return {
    blobUrl: result?.source === url ? result.blobUrl : undefined,
    error: result?.source === url ? result.error : undefined,
  };
}
