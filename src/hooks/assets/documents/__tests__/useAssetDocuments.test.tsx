import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../../__mocks__/documents';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { DOCUMENT_QUERY_LIMIT } from '../../../../constants/documents';
import { DocumentUploadStatus } from '../../../../enums/documentUploadStatus';
import type { AssetDocument } from '../../../../types/document';
import type { LimitedList } from '../../../../types/list';
import { AssetContext } from '../../useAssetContext';
import {
  useAssetDocuments,
  UseAssetDocumentsContext,
  type UseAssetDocumentsContextType,
} from '../useAssetDocuments';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetDocuments.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetDocumentsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetDocuments: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetDocument()]))),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDocumentsContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetDocumentsContext.Provider>
    );
  });

  it('is pending until the documents arrive', async () => {
    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the documents of the asset with the injected client', async () => {
    const documents = makeLimitedList([makeAssetDocument({ externalId: 'doc-2' })]);
    vi.mocked(mockContext.listAssetDocuments).mockResolvedValue(documents);

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(documents));
    expect(mockContext.listAssetDocuments).toHaveBeenCalledWith(
      client,
      assetIdentifier,
      DOCUMENT_QUERY_LIMIT,
    );
  });

  it('reads on to a longer limit while the documents already read stay', async () => {
    // Arrange
    const firstPage = makeLimitedList([makeAssetDocument({ externalId: 'doc-1' })], true);
    const longer = deferred<LimitedList<AssetDocument>>();
    vi.mocked(mockContext.listAssetDocuments)
      .mockResolvedValueOnce(firstPage)
      .mockReturnValueOnce(longer.promise);
    const { result, rerender } = renderHook(
      ({ limit }) => useAssetDocuments(assetIdentifier, limit),
      { wrapper, initialProps: { limit: 1 } },
    );
    await waitFor(() => expect(result.current.data).toEqual(firstPage));

    // Act
    rerender({ limit: 2 });

    // Assert
    expect(result.current.data).toEqual(firstPage);
    expect(result.current.isPlaceholderData).toBe(true);
    expect(mockContext.listAssetDocuments).toHaveBeenLastCalledWith(client, assetIdentifier, 2);
    longer.resolve(makeLimitedList([makeAssetDocument()]));
    await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
  });

  it('never shows the documents of another asset while its own load', async () => {
    // Arrange
    const otherAsset = { space: 'asset-space', externalId: 'FLOC-2' };
    vi.mocked(mockContext.listAssetDocuments)
      .mockResolvedValueOnce(makeLimitedList([makeAssetDocument()]))
      .mockReturnValueOnce(deferred<LimitedList<AssetDocument>>().promise);
    const { result, rerender } = renderHook(({ asset }) => useAssetDocuments(asset), {
      wrapper,
      initialProps: { asset: assetIdentifier },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Act
    rerender({ asset: otherAsset });

    // Assert
    expect(result.current.data).toBeUndefined();
    expect(result.current.isPending).toBe(true);
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetDocuments).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('keeps re-reading a fresh document until it is marked uploaded', async () => {
    vi.mocked(mockContext.listAssetDocuments)
      .mockResolvedValueOnce(
        makeLimitedList([
          makeAssetDocument({
            isUploaded: false,
            uploadStatus: DocumentUploadStatus.PROCESSING,
          }),
        ]),
      )
      .mockResolvedValue(makeLimitedList([makeAssetDocument({ isUploaded: true })]));

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data?.items[0]?.isUploaded).toBe(true), {
      timeout: 5_000,
    });
    expect(mockContext.listAssetDocuments).toHaveBeenCalledTimes(2);
  });
});

function deferred<Value>() {
  let resolve: (value: Value) => void = () => {};
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}
