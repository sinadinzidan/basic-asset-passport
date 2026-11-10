import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../mocks/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../mocks/queryClientWrapper';
import { getAssetDocumentsQueryKey } from '../useAssetDocuments';
import {
  useDeleteAssetDocument,
  UseDeleteAssetDocumentContext,
  type UseDeleteAssetDocumentContextType,
} from '../useDeleteAssetDocument';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const document = { space: 'data', externalId: 'doc-1' };

describe(useDeleteAssetDocument.name, () => {
  const client = makeMockClient();
  let queryClient: QueryClient;
  let mockContext: UseDeleteAssetDocumentContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      deleteAssetDocument: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper(queryClient);
    wrapper = ({ children }) => (
      <UseDeleteAssetDocumentContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseDeleteAssetDocumentContext.Provider>
    );
  });

  it('deletes the document with the injected client', async () => {
    const { result } = renderHook(
      () => useDeleteAssetDocument(assetIdentifier),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(document);
    });

    expect(mockContext.deleteAssetDocument).toHaveBeenCalledWith(
      client,
      document,
    );
  });

  it('refreshes the documents of that asset after a delete', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useDeleteAssetDocument(assetIdentifier),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(document);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
    });
  });

  it('reports a failed delete and does not refresh the list', async () => {
    vi.mocked(mockContext.deleteAssetDocument).mockRejectedValue(
      new Error('Forbidden'),
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useDeleteAssetDocument(assetIdentifier),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(document).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidate).not.toHaveBeenCalled();
  });
});
