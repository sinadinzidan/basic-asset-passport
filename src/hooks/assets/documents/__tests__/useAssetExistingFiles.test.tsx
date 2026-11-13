import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../../__mocks__/documents';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { DOCUMENT_QUERY_LIMIT } from '../../../../constants/documents';
import { DocumentOrigin } from '../../../../enums/documentOrigin';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import { AssetClientContext } from '../../useAssetClient';
import { useAssetExistingFiles, UseAssetExistingFilesContext } from '../useAssetExistingFiles';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetExistingFiles.name, () => {
  const client = makeMockClient();
  let mockContext: Pick<AssetDocumentService, 'listAssetLinkedFiles'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetLinkedFiles: vi.fn(() =>
        Promise.resolve(makeLimitedList([makeAssetDocument({ origin: DocumentOrigin.RMDM })])),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetExistingFilesContext.Provider
        value={{ createAssetDocumentService: () => mockContext }}
      >
        <QueryWrapper>
          <AssetClientContext.Provider value={client}>{children}</AssetClientContext.Provider>
        </QueryWrapper>
      </UseAssetExistingFilesContext.Provider>
    );
  });

  it('is pending until the files arrive', async () => {
    const { result } = renderHook(() => useAssetExistingFiles(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('loads the files linked to the asset with the injected client', async () => {
    const files = makeLimitedList([
      makeAssetDocument({ externalId: 'file-2', origin: DocumentOrigin.RMDM }),
    ]);

    vi.mocked(mockContext.listAssetLinkedFiles).mockResolvedValue(files);

    const { result } = renderHook(() => useAssetExistingFiles(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(files));
    expect(mockContext.listAssetLinkedFiles).toHaveBeenCalledWith(
      assetIdentifier,
      DOCUMENT_QUERY_LIMIT,
    );
  });

  it('reads the files to the limit asked for', async () => {
    const { result } = renderHook(() => useAssetExistingFiles(assetIdentifier, 300), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(mockContext.listAssetLinkedFiles).toHaveBeenCalledWith(assetIdentifier, 300);
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetLinkedFiles).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAssetExistingFiles(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
