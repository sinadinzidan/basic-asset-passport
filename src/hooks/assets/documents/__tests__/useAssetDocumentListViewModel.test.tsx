import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../../__mocks__/documents';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { DOCUMENT_QUERY_LIMIT } from '../../../../constants/documents';
import { DocumentOrigin } from '../../../../enums/documentOrigin';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import { AssetContext } from '../../useAssetContext';
import { useAssetDocumentListViewModel } from '../useAssetDocumentListViewModel';
import { UseAssetDocumentsContext } from '../useAssetDocuments';
import { UseAssetLinkedFilesContext } from '../useAssetLinkedFiles';
import { UseDeleteAssetDocumentContext } from '../useDeleteAssetDocument';
import { DocumentFileContext } from '../useDocumentFileContext';
import {
  useUploadAssetDocuments,
  UseUploadAssetDocumentsContext,
} from '../useUploadAssetDocuments';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const otherAsset = { space: 'asset-space', externalId: 'FLOC-2' };
const documentFileContext = {} as Partial<DocumentFileContextType> as DocumentFileContextType;

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });
const uploaded = makeAssetDocument();
const existing = makeAssetDocument({ externalId: 'file-1', origin: DocumentOrigin.RMDM });

describe(useAssetDocumentListViewModel.name, () => {
  const client = makeMockClient();
  let documentService: Pick<AssetDocumentService, 'listAssetDocuments'> &
    Pick<AssetDocumentService, 'listAssetLinkedFiles'> &
    Pick<AssetDocumentService, 'deleteAssetDocument'> &
    Pick<AssetDocumentService, 'uploadAssetDocument'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    documentService = {
      listAssetDocuments: vi.fn(() => Promise.resolve(makeLimitedList([uploaded], true))),
      listAssetLinkedFiles: vi.fn(() => Promise.resolve(makeLimitedList([existing]))),
      deleteAssetDocument: vi.fn(() => Promise.resolve()),
      uploadAssetDocument: vi.fn(() => new Promise<void>(() => {})),
    };
    const deps = documentService;
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetDocumentsContext.Provider value={{ createAssetDocumentService: () => deps }}>
        <UseAssetLinkedFilesContext.Provider value={{ createAssetDocumentService: () => deps }}>
          <UseDeleteAssetDocumentContext.Provider
            value={{ createAssetDocumentService: () => deps }}
          >
            <QueryWrapper>
              <AssetContext.Provider value={client}>
                <NavigationStoreContext.Provider value={navigationStore}>
                  <UseUploadAssetDocumentsContext.Provider
                    value={{
                      useSuccessToast: () => vi.fn(),
                      createAssetDocumentService: () => deps,
                    }}
                  >
                    <DocumentFileContext.Provider value={documentFileContext}>
                      {children}
                    </DocumentFileContext.Provider>
                  </UseUploadAssetDocumentsContext.Provider>
                </NavigationStoreContext.Provider>
              </AssetContext.Provider>
            </QueryWrapper>
          </UseDeleteAssetDocumentContext.Provider>
        </UseAssetLinkedFilesContext.Provider>
      </UseAssetDocumentsContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetDocumentListViewModel(), { wrapper });
  }

  it('is pending with nothing to show until the documents arrive', async () => {
    const { result } = renderViewModel();

    expect(result.current.isPending).toBe(true);
    expect(result.current.documents).toEqual([]);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the uploaded documents and the existing files, each with whether there are more', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.existingFiles).toEqual([existing]));
    expect(result.current.documents).toEqual([uploaded]);
    expect(result.current.hasMoreDocuments).toBe(true);
    expect(result.current.hasMoreExistingFiles).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });

  it('stays pending while nothing was uploaded and the existing files still load', async () => {
    vi.mocked(documentService.listAssetDocuments).mockResolvedValue(makeLimitedList([]));
    vi.mocked(documentService.listAssetLinkedFiles).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    await waitFor(() => expect(documentService.listAssetDocuments).toHaveBeenCalled());

    expect(result.current.isPending).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it('is empty only when both lists loaded with nothing in them', async () => {
    vi.mocked(documentService.listAssetDocuments).mockResolvedValue(makeLimitedList([]));
    vi.mocked(documentService.listAssetLinkedFiles).mockResolvedValue(makeLimitedList([]));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isEmpty).toBe(true));
  });

  it('is not empty when the existing files failed, and reads them again on retry', async () => {
    vi.mocked(documentService.listAssetDocuments).mockResolvedValue(makeLimitedList([]));
    vi.mocked(documentService.listAssetLinkedFiles).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.hasExistingFilesError).toBe(true));
    expect(result.current.isEmpty).toBe(false);
    expect(result.current.existingFilesError).toEqual(new Error('no access'));

    act(() => result.current.retryExistingFiles());

    await waitFor(() => expect(result.current.existingFiles).toEqual([existing]));
  });

  it('reads a longer list of each kind when more are asked for', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.hasMoreDocuments).toBe(true));

    act(() => result.current.showMoreDocuments());
    act(() => result.current.showMoreExistingFiles());

    await waitFor(() =>
      expect(documentService.listAssetDocuments).toHaveBeenLastCalledWith(
        assetIdentifier,
        DOCUMENT_QUERY_LIMIT * 2,
      ),
    );
    await waitFor(() =>
      expect(documentService.listAssetLinkedFiles).toHaveBeenLastCalledWith(
        assetIdentifier,
        DOCUMENT_QUERY_LIMIT * 2,
      ),
    );
  });

  it('says which document is being deleted while the delete runs', async () => {
    vi.mocked(documentService.deleteAssetDocument).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.documents).toHaveLength(1));

    act(() => void result.current.deleteDocument(uploaded));

    await waitFor(() => expect(result.current.isDeleting(uploaded)).toBe(true));
    expect(result.current.isDeleting(existing)).toBe(false);
  });

  it('keeps why a document could not be deleted, without throwing', async () => {
    vi.mocked(documentService.deleteAssetDocument).mockRejectedValue(new Error('No write access.'));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.documents).toHaveLength(1));

    await act(() => result.current.deleteDocument(uploaded));

    await waitFor(() => expect(result.current.deleteErrorMessage).toBe('No write access.'));
  });

  it('reports a failed load with its error, not as pending, and reads again on retry', async () => {
    vi.mocked(documentService.listAssetDocuments).mockRejectedValueOnce(new Error('no access'));
    vi.mocked(documentService.listAssetLinkedFiles).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.documents).toEqual([uploaded]));
  });

  it('lists no uploading files when nothing is uploading', async () => {
    const { result } = renderViewModel();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.uploadingNames).toEqual([]);
  });

  it('lists the files being uploaded to the asset', async () => {
    const { result } = renderHook(
      () => ({
        viewModel: useAssetDocumentListViewModel(),
        uploads: useUploadAssetDocuments(assetIdentifier),
      }),
      { wrapper },
    );

    act(() => {
      void result.current.uploads.upload([makeFile('a.pdf'), makeFile('b.pdf')]);
    });

    await waitFor(() =>
      expect(result.current.viewModel.uploadingNames).toEqual(['a.pdf', 'b.pdf']),
    );
  });

  it('does not list files being uploaded to another asset', async () => {
    const { result } = renderHook(
      () => ({
        viewModel: useAssetDocumentListViewModel(),
        uploads: useUploadAssetDocuments(otherAsset),
      }),
      { wrapper },
    );

    act(() => {
      void result.current.uploads.upload([makeFile('a.pdf')]);
    });

    await waitFor(() => expect(result.current.uploads.isUploading).toBe(true));
    expect(result.current.viewModel.uploadingNames).toEqual([]);
  });
});

function makeFile(name: string): File {
  return new File(['content'], name, { type: 'application/pdf' });
}
