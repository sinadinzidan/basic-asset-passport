import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import type { DocumentFileClient } from '../../../../types/documentFileClient';
import {
  useUploadAssetDocuments,
  UseUploadAssetDocumentsContext,
  type UseUploadAssetDocumentsContextType,
} from '../useUploadAssetDocuments';
import {
  useUploadingDocumentNames,
  UseUploadingDocumentNamesContext,
} from '../useUploadingDocumentNames';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const otherAsset = { space: 'asset-space', externalId: 'FLOC-2' };

describe(useUploadingDocumentNames.name, () => {
  const client = makeMockClient();
  let uploadContext: UseUploadAssetDocumentsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    uploadContext = {
      useAssetDataClient: vi.fn(() => client),
      useDocumentFileClient: vi.fn(
        () => ({}) as Partial<DocumentFileClient> as DocumentFileClient,
      ),
      useSuccessToast: vi.fn(() => vi.fn()),
      uploadAssetDocument: vi.fn(() => new Promise<void>(() => {})),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseUploadAssetDocumentsContext.Provider value={uploadContext}>
        <UseUploadingDocumentNamesContext.Provider
          value={{ useAssetDataClient: () => client }}
        >
          <QueryWrapper>{children}</QueryWrapper>
        </UseUploadingDocumentNamesContext.Provider>
      </UseUploadAssetDocumentsContext.Provider>
    );
  });

  function makeFile(name: string): File {
    return new File(['content'], name, { type: 'application/pdf' });
  }

  it('is empty when nothing is uploading', () => {
    const { result } = renderHook(
      () => useUploadingDocumentNames(assetIdentifier),
      { wrapper },
    );

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
      result.current.upload.mutate([makeFile('a.pdf'), makeFile('b.pdf')]);
    });

    await waitFor(() =>
      expect(result.current.names).toEqual(['a.pdf', 'b.pdf']),
    );
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
      result.current.upload.mutate([makeFile('a.pdf')]);
    });

    await waitFor(() => expect(result.current.upload.isPending).toBe(true));
    expect(result.current.names).toEqual([]);
  });
});
