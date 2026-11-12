import type { CogniteClient } from '@cognite/sdk';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../__mocks__/cogniteClient';
import { clearAnnotationCache, useDocumentAnnotations } from '../useDocumentAnnotations';

const instanceId = { space: 'files', externalId: 'doc-1' };

type EdgeOverrides = {
  externalId?: string;
  type?: string;
  hasEndNode?: boolean;
  properties?: Record<string, unknown> | null;
};

function makeEdge({
  externalId = 'edge-1',
  type,
  hasEndNode = true,
  properties = {},
}: EdgeOverrides = {}) {
  return {
    instanceType: 'edge' as const,
    space: 'annotations',
    externalId,
    version: 1,
    createdTime: 0,
    lastUpdatedTime: 0,
    type: type ? { space: 'cdf_cdm', externalId: type } : undefined,
    startNode: instanceId,
    endNode: hasEndNode ? { space: 'assets', externalId: 'PUMP-1' } : undefined,
    properties:
      properties === null
        ? undefined
        : {
            cdf_cdm: {
              'CogniteDiagramAnnotation/v1': {
                startNodeXMin: 0.1,
                startNodeXMax: 0.3,
                startNodeYMin: 0.2,
                startNodeYMax: 0.6,
                startNodePageNumber: 1,
                startNodeText: 'PUMP-1',
                ...properties,
              },
            },
          },
  };
}

function queryResponse(annotations: unknown[], nextCursor?: string) {
  return {
    items: { annotations },
    nextCursor: nextCursor ? { annotations: nextCursor } : {},
  } as Partial<Awaited<ReturnType<CogniteClient['instances']['query']>>> as Awaited<
    ReturnType<CogniteClient['instances']['query']>
  >;
}

describe('useDocumentAnnotations', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
    clearAnnotationCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the annotations of the file and shapes them for the current page', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(queryResponse([makeEdge({ type: 'diagrams.AssetLink' })]));

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId, 1));

    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    const [annotation] = result.current.annotations;
    expect(annotation).toMatchObject({
      id: 'files:doc-1-annotations-edge-1',
      page: 1,
      resourceType: 'asset',
      linkedResource: { space: 'assets', externalId: 'PUMP-1' },
      text: 'PUMP-1',
      annotationType: 'diagrams.AssetLink',
    });
    expect(annotation?.x).toBeCloseTo(0.1);
    expect(annotation?.y).toBeCloseTo(0.2);
    expect(annotation?.width).toBeCloseTo(0.2);
    expect(annotation?.height).toBeCloseTo(0.4);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('shows only the annotations of the current page', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      queryResponse([
        makeEdge({ externalId: 'first' }),
        makeEdge({ externalId: 'second', properties: { startNodePageNumber: 2 } }),
      ]),
    );

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useDocumentAnnotations(client, instanceId, page),
      { initialProps: { page: 1 } },
    );
    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    rerender({ page: 2 });

    expect(result.current.annotations.map(({ id }) => id)).toEqual([
      'files:doc-1-annotations-second',
    ]);
  });

  it('leaves out rejected annotations, ones without properties, and nodes', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      queryResponse([
        makeEdge({ externalId: 'rejected', properties: { status: 'Rejected' } }),
        makeEdge({ externalId: 'bare', properties: null }),
        { ...makeEdge({ externalId: 'node' }), instanceType: 'node' },
        makeEdge({ externalId: 'kept' }),
      ]),
    );

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    expect(result.current.annotations[0]?.id).toBe('files:doc-1-annotations-kept');
  });

  it.each([
    ['diagrams.AssetLink', 'asset'],
    ['diagrams.FileLink', 'file'],
    ['TimeSeriesLink', 'timeSeries'],
    ['time_series_link', 'timeSeries'],
    ['SequenceLink', 'sequence'],
    ['EventLink', 'event'],
    ['diagrams.Other', 'diagram'],
    ['Something', 'unknown'],
  ])('reads the annotation type %s as a link to a %s', async (type, resourceType) => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(queryResponse([makeEdge({ type })]));

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    expect(result.current.annotations[0]?.resourceType).toBe(resourceType);
  });

  it('fills in what an annotation leaves out', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      queryResponse([
        makeEdge({
          hasEndNode: false,
          properties: {
            startNodeXMin: undefined,
            startNodeXMax: undefined,
            startNodeYMin: undefined,
            startNodeYMax: undefined,
            startNodePageNumber: undefined,
            startNodeText: undefined,
          },
        }),
      ]),
    );

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    expect(result.current.annotations[0]).toMatchObject({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      page: 1,
      resourceType: 'asset',
      annotationType: 'diagrams.AssetLink',
    });
    expect(result.current.annotations[0]?.linkedResource).toBeUndefined();
    expect(result.current.annotations[0]?.text).toBeUndefined();
  });

  it('reads on with the cursor while a page comes back full', async () => {
    const fullPage = Array.from({ length: 10_000 }, (_, index) =>
      makeEdge({ externalId: `edge-${index}` }),
    );
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValueOnce(queryResponse(fullPage, 'next'))
      .mockResolvedValueOnce(queryResponse([makeEdge({ externalId: 'last' })]));

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.annotations).toHaveLength(10_001));
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1]?.[0].cursors).toEqual({ annotations: 'next' });
  });

  it('reads nothing when it is disabled or has no client or file', () => {
    const query = vi.spyOn(client.instances, 'query');

    const disabled = renderHook(() =>
      useDocumentAnnotations(client, instanceId, 1, { enabled: false }),
    );
    const withoutClient = renderHook(() => useDocumentAnnotations(undefined, instanceId));
    const withoutFile = renderHook(() => useDocumentAnnotations(client, undefined));

    for (const { result } of [disabled, withoutClient, withoutFile]) {
      expect(result.current).toEqual({ annotations: [], isLoading: false, error: null });
    }
    expect(query).not.toHaveBeenCalled();
  });

  it('reuses the annotations of a file it read before', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(queryResponse([makeEdge()]));
    const first = renderHook(() => useDocumentAnnotations(client, instanceId));
    await waitFor(() => expect(first.result.current.annotations).toHaveLength(1));

    const second = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(second.result.current.annotations).toHaveLength(1));
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reads again once the cached annotations are stale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(queryResponse([makeEdge()]));
    const first = renderHook(() => useDocumentAnnotations(client, instanceId));
    await waitFor(() => expect(first.result.current.annotations).toHaveLength(1));

    vi.setSystemTime(Date.now() + 6 * 60 * 1000);
    const second = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(query).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
  });

  it('keeps the annotations of no more files than its cache holds', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(queryResponse([makeEdge()]));
    for (let index = 0; index <= 50; index += 1) {
      const { result } = renderHook(() =>
        useDocumentAnnotations(client, { space: 'files', externalId: `doc-${index}` }),
      );
      await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    }
    query.mockClear();

    const oldest = renderHook(() =>
      useDocumentAnnotations(client, { space: 'files', externalId: 'doc-0' }),
    );

    await waitFor(() => expect(oldest.result.current.annotations).toHaveLength(1));
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('reports why the annotations could not be read', async () => {
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.error?.message).toBe('no access'));
    expect(result.current.annotations).toEqual([]);
  });

  it('turns a failure that is not an error into one', async () => {
    vi.spyOn(client.instances, 'query').mockRejectedValue('offline');

    const { result } = renderHook(() => useDocumentAnnotations(client, instanceId));

    await waitFor(() => expect(result.current.error?.message).toBe('offline'));
  });

  it('ignores the answer for a file it has moved on from', async () => {
    let resolveFirst: (value: ReturnType<typeof queryResponse>) => void = () => {};
    vi.spyOn(client.instances, 'query')
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(queryResponse([makeEdge({ externalId: 'second-file' })]));
    const { result, rerender } = renderHook(
      ({ externalId }: { externalId: string }) =>
        useDocumentAnnotations(client, { space: 'files', externalId }),
      { initialProps: { externalId: 'doc-1' } },
    );

    rerender({ externalId: 'doc-2' });
    await waitFor(() => expect(result.current.annotations).toHaveLength(1));
    resolveFirst(queryResponse([makeEdge({ externalId: 'a' }), makeEdge({ externalId: 'b' })]));
    await Promise.resolve();

    expect(result.current.annotations.map(({ id }) => id)).toEqual([
      'files:doc-2-annotations-second-file',
    ]);
  });
});
