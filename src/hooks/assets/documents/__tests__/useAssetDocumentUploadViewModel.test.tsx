import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import { AssetContext } from '../../useAssetContext';
import { useAssetDocumentUploadViewModel } from '../useAssetDocumentUploadViewModel';
import { DocumentFileContext } from '../useDocumentFileContext';
import { UseUploadAssetDocumentsContext } from '../useUploadAssetDocuments';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });
const good = new File(['a'], 'good.pdf', { type: 'application/pdf' });
const bad = new File(['b'], 'bad.pdf', { type: 'application/pdf' });

describe(useAssetDocumentUploadViewModel.name, () => {
  const client = makeMockClient();
  const fileClient = {} as Partial<DocumentFileContextType> as DocumentFileContextType;
  let documentService: Pick<AssetDocumentService, 'uploadAssetDocument'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    documentService = {
      uploadAssetDocument: vi.fn((_files, _asset, file: File) =>
        file === bad ? Promise.reject(new Error('The file is empty.')) : Promise.resolve(),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseUploadAssetDocumentsContext.Provider
        value={{
          useSuccessToast: () => vi.fn(),
          createAssetDocumentService: () => documentService,
        }}
      >
        <QueryWrapper>
          <DocumentFileContext.Provider value={fileClient}>
            <AssetContext.Provider value={client}>
              <NavigationStoreContext.Provider value={navigationStore}>
                {children}
              </NavigationStoreContext.Provider>
            </AssetContext.Provider>
          </DocumentFileContext.Provider>
        </QueryWrapper>
      </UseUploadAssetDocumentsContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetDocumentUploadViewModel(), { wrapper });
  }

  it('starts with nothing uploading and no failures', () => {
    const { result } = renderViewModel();

    expect(result.current.isUploading).toBe(false);
    expect(result.current.failures).toEqual([]);
  });

  it('is uploading while the files are sent', async () => {
    vi.mocked(documentService.uploadAssetDocument).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    act(() => result.current.upload([good]));

    await waitFor(() => expect(result.current.isUploading).toBe(true));
  });

  it('sends nothing when no file was chosen', () => {
    const { result } = renderViewModel();

    act(() => result.current.upload([]));

    expect(documentService.uploadAssetDocument).not.toHaveBeenCalled();
  });

  it('lists only the files that failed, with the reason', async () => {
    const { result } = renderViewModel();

    act(() => result.current.upload([good, bad]));

    await waitFor(() =>
      expect(result.current.failures).toEqual([
        { fileName: 'bad.pdf', errorMessage: 'The file is empty.' },
      ]),
    );
  });

  it('uploads only the failed files again on retry', async () => {
    const { result } = renderViewModel();
    act(() => result.current.upload([good, bad]));
    await waitFor(() => expect(result.current.failures).toHaveLength(1));
    vi.mocked(documentService.uploadAssetDocument).mockClear();

    act(() => result.current.retryFailed());

    await waitFor(() => expect(documentService.uploadAssetDocument).toHaveBeenCalledTimes(1));
    expect(documentService.uploadAssetDocument).toHaveBeenCalledWith(
      fileClient,
      assetIdentifier,
      bad,
    );
  });
});
