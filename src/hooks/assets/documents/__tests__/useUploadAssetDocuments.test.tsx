import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import type { ShowSuccessToast } from '../../../general/useSuccessToast';
import { AssetClientContext } from '../../useAssetClient';
import { getAssetDocumentsQueryKey } from '../useAssetDocuments';
import { DocumentFileClientContext } from '../useDocumentFileClient';
import {
  useUploadAssetDocuments,
  UseUploadAssetDocumentsContext,
  type UseUploadAssetDocumentsContextType,
} from '../useUploadAssetDocuments';

const REJECTED_FILE_NAME = 'bad.pdf';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useUploadAssetDocuments.name, () => {
  const client = makeMockClient();
  const fileClient = {} as Partial<DocumentFileContextType> as DocumentFileContextType;
  let queryClient: QueryClient;
  let mockContext: Pick<UseUploadAssetDocumentsContextType, 'useSuccessToast'> &
    Pick<AssetDocumentService, 'uploadAssetDocument'>;
  let showSuccessToast: Mock<ShowSuccessToast>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    queryClient = makeTestQueryClient();
    showSuccessToast = vi.fn();
    mockContext = {
      useSuccessToast: vi.fn(() => showSuccessToast),
      uploadAssetDocument: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    wrapper = ({ children }) => (
      <UseUploadAssetDocumentsContext.Provider
        value={{
          useSuccessToast: mockContext.useSuccessToast,
          createAssetDocumentService: () => mockContext,
        }}
      >
        <QueryWrapper>
          <DocumentFileClientContext.Provider value={fileClient}>
            <AssetClientContext.Provider value={client}>{children}</AssetClientContext.Provider>
          </DocumentFileClientContext.Provider>
        </QueryWrapper>
      </UseUploadAssetDocumentsContext.Provider>
    );
  });

  function makeFile(name: string): File {
    return new File(['content'], name, { type: 'application/pdf' });
  }

  it('uploads every file for the asset with the injected clients', async () => {
    // Arrange
    const first = makeFile('a.pdf');
    const second = makeFile('b.pdf');
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    // Act
    let results: Awaited<ReturnType<typeof result.current.upload>> = [];

    await act(async () => {
      results = await result.current.upload([first, second]);
    });

    // Assert
    expect(mockContext.uploadAssetDocument).toHaveBeenCalledWith(
      fileClient,
      assetIdentifier,
      first,
    );
    expect(mockContext.uploadAssetDocument).toHaveBeenCalledWith(
      fileClient,
      assetIdentifier,
      second,
    );
    expect(results).toEqual([
      { fileName: 'a.pdf', errorMessage: null },
      { fileName: 'b.pdf', errorMessage: null },
    ]);
  });

  it('keeps uploading the other files when one fails', async () => {
    // Arrange
    vi.mocked(mockContext.uploadAssetDocument).mockImplementation((_files, _asset, file) =>
      file.name === REJECTED_FILE_NAME
        ? Promise.reject(new Error('The file is empty.'))
        : Promise.resolve(),
    );
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    // Act
    let results: Awaited<ReturnType<typeof result.current.upload>> = [];

    await act(async () => {
      results = await result.current.upload([makeFile(REJECTED_FILE_NAME), makeFile('good.pdf')]);
    });

    // Assert
    expect(results).toEqual([
      { fileName: REJECTED_FILE_NAME, errorMessage: 'The file is empty.' },
      { fileName: 'good.pdf', errorMessage: null },
    ]);
  });

  it('refreshes the documents of that asset when the uploads settle', async () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.upload([makeFile('a.pdf')]);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
    });
  });

  it('confirms the uploaded files in a toast', async () => {
    // Arrange
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    // Act
    await act(async () => {
      await result.current.upload([makeFile('a.pdf'), makeFile('b.pdf')]);
    });

    // Assert
    expect(showSuccessToast).toHaveBeenCalledTimes(1);
    expect(showSuccessToast).toHaveBeenCalledWith('2 documents uploaded.');
  });

  it('only counts the files that uploaded', async () => {
    vi.mocked(mockContext.uploadAssetDocument).mockImplementation((_files, _asset, file) =>
      file.name === REJECTED_FILE_NAME
        ? Promise.reject(new Error('The file is empty.'))
        : Promise.resolve(),
    );
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.upload([makeFile(REJECTED_FILE_NAME), makeFile('good.pdf')]);
    });

    expect(showSuccessToast).toHaveBeenCalledWith('1 document uploaded.');
  });

  it('shows no toast when every file failed', async () => {
    vi.mocked(mockContext.uploadAssetDocument).mockRejectedValue(new Error('forbidden'));
    const { result } = renderHook(() => useUploadAssetDocuments(assetIdentifier), { wrapper });

    await act(async () => {
      await result.current.upload([makeFile('a.pdf')]);
    });

    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
