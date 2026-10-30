import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAnnotationCache, useDocumentAnnotations } from '../useDocumentAnnotations';

afterEach(() => {
  vi.restoreAllMocks();
  clearAnnotationCache();
});

describe('useDocumentAnnotations', () => {
  it('follows annotation cursors even for short result pages and filters rejected and other-page annotations', async () => {
    const client = createClient();
    const query = vi.spyOn(client.instances, 'query')
      .mockResolvedValueOnce({ items: { annotations: [] }, nextCursor: { annotations: 'next' } })
      .mockResolvedValueOnce({ items: { annotations: [
        createAnnotation('first', 1, 'Approved'),
        createAnnotation('second', 2, 'Approved'),
        createAnnotation('rejected', 1, 'Rejected'),
      ] }, nextCursor: {} });
    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useDocumentAnnotations(client, { space: 'files', externalId: 'PID-1' }, page),
      { initialProps: { page: 1 }, wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.annotations).toHaveLength(1);
    expect(result.current.annotations[0]).toMatchObject({
      text: 'first', x: 0.1, y: 0.2, page: 1,
      linkedResource: { space: 'assets', externalId: 'P-101' },
    });
    expect(query).toHaveBeenLastCalledWith(expect.objectContaining({ cursors: { annotations: 'next' } }));
    rerender({ page: 2 });
    expect(result.current.annotations[0].text).toBe('second');
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('does not request annotations when disabled and exposes permission failures', async () => {
    const client = createClient();
    const query = vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('Forbidden'));
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useDocumentAnnotations(client, { space: 'files', externalId: 'PID-1' }, 1, { enabled }),
      { initialProps: { enabled: false }, wrapper: createWrapper() }
    );
    expect(query).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.error?.message).toBe('Forbidden'));
  });
});

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createClient(): CogniteClient {
  return new CogniteClient({ appId: 'test', project: 'test', oidcTokenProvider: async () => 'test' });
}

function createAnnotation(externalId: string, page: number, status: string) {
  return {
    instanceType: 'edge' as const, space: 'annotations', externalId, version: 1, createdTime: 0, lastUpdatedTime: 0,
    type: { space: 'types', externalId: 'diagrams.AssetLink' },
    startNode: { space: 'files', externalId: 'PID-1' }, endNode: { space: 'assets', externalId: 'P-101' },
    properties: { cdf_cdm: { 'CogniteDiagramAnnotation/v1': {
      status, startNodePageNumber: page, startNodeText: externalId,
      startNodeXMin: 0.1, startNodeXMax: 0.3, startNodeYMin: 0.2, startNodeYMax: 0.4,
    } } },
  };
}
