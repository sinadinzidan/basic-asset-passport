import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentUploadStatus } from '../../../../enums/documentUploadStatus';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeAssetDocument } from '../../../../mocks/documents';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
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
      useAssetDataClient: vi.fn(() => client),
      listAssetDocuments: vi.fn(() => Promise.resolve([makeAssetDocument()])),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDocumentsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
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
    const documents = [makeAssetDocument({ externalId: 'doc-2' })];
    vi.mocked(mockContext.listAssetDocuments).mockResolvedValue(documents);

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(documents));
    expect(mockContext.listAssetDocuments).toHaveBeenCalledWith(
      client,
      assetIdentifier,
    );
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetDocuments).mockRejectedValue(
      new Error('no access'),
    );

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('keeps re-reading a fresh document until it is marked uploaded', async () => {
    vi.mocked(mockContext.listAssetDocuments)
      .mockResolvedValueOnce([
        makeAssetDocument({
          isUploaded: false,
          uploadStatus: DocumentUploadStatus.PROCESSING,
        }),
      ])
      .mockResolvedValue([makeAssetDocument({ isUploaded: true })]);

    const { result } = renderHook(() => useAssetDocuments(assetIdentifier), {
      wrapper,
    });

    await waitFor(
      () => expect(result.current.data?.[0]?.isUploaded).toBe(true),
      {
        timeout: 5_000,
      },
    );
    expect(mockContext.listAssetDocuments).toHaveBeenCalledTimes(2);
  });
});
