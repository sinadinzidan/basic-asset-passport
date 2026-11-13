import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import { AssetContext } from '../../useAssetContext';
import { DocumentFileContext } from '../useDocumentFileContext';
import {
  useUploadAssetDocuments,
  UseUploadAssetDocumentsContext,
  type UseUploadAssetDocumentsContextType,
} from '../useUploadAssetDocuments';
import { useUploadingDocumentNames } from '../useUploadingDocumentNames';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const otherAsset = { space: 'asset-space', externalId: 'FLOC-2' };

describe(useUploadingDocumentNames.name, () => {
  const client = makeMockClient();
  const documentFileContext = {} as Partial<DocumentFileContextType> as DocumentFileContextType;
  let uploadContext: Pick<UseUploadAssetDocumentsContextType, 'useSuccessToast'> &
    Pick<AssetDocumentService, 'uploadAssetDocument'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    uploadContext = {
      useSuccessToast: vi.fn(() => vi.fn()),
      uploadAssetDocument: vi.fn(() => new Promise<void>(() => {})),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseUploadAssetDocumentsContext.Provider
        value={{
          useSuccessToast: uploadContext.useSuccessToast,
          createAssetDocumentService: () => uploadContext,
        }}
      >
        <QueryWrapper>
          <AssetContext.Provider value={client}>
            <DocumentFileContext.Provider value={documentFileContext}>
              {children}
            </DocumentFileContext.Provider>
          </AssetContext.Provider>
        </QueryWrapper>
      </UseUploadAssetDocumentsContext.Provider>
    );
  });

  function makeFile(name: string): File {
    return new File(['content'], name, { type: 'application/pdf' });
  }

  it('is empty when nothing is uploading', () => {
    const { result } = renderHook(() => useUploadingDocumentNames(assetIdentifier), { wrapper });

    expect(result.current).toEqual([]);
  });

  it('lists the files being uploaded to the asset', async () => {
    const { result } = renderHook(
      () => ({
        names: useUploadingDocumentNames(assetIdentifier),
        upload: useUploadAssetDocuments(assetIdentifier),
      }),
      { wrapper },
    );

    act(() => {
      void result.current.upload.upload([makeFile('a.pdf'), makeFile('b.pdf')]);
    });

    await waitFor(() => expect(result.current.names).toEqual(['a.pdf', 'b.pdf']));
  });

  it('does not list files being uploaded to another asset', async () => {
    const { result } = renderHook(
      () => ({
        names: useUploadingDocumentNames(assetIdentifier),
        upload: useUploadAssetDocuments(otherAsset),
      }),
      { wrapper },
    );

    act(() => {
      void result.current.upload.upload([makeFile('a.pdf')]);
    });

    await waitFor(() => expect(result.current.upload.isUploading).toBe(true));
    expect(result.current.names).toEqual([]);
  });
});
