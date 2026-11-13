import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../../__mocks__/documents';
import { makeLimitedList } from '../../../../__mocks__/lists';
import { makeNavigationStore } from '../../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import { UseAssetDocumentsContext } from '../../../../hooks/assets/documents/useAssetDocuments';
import { UseAssetLinkedFilesContext } from '../../../../hooks/assets/documents/useAssetLinkedFiles';
import { DocumentFileContext } from '../../../../hooks/assets/documents/useDocumentFileContext';
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../../hooks/general/useNavigationState';
import type { AssetDocumentService } from '../../../../services/assets/documents/assetDocument';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import { AssetDocuments } from '../AssetDocuments';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

const navigationStore = makeNavigationStore({ selectedAsset: assetIdentifier });

describe(AssetDocuments.name, () => {
  let listContext: Pick<AssetDocumentService, 'listAssetDocuments'>;
  let linkedContext: Pick<AssetDocumentService, 'listAssetLinkedFiles'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const files: DocumentFileContextType = {
      requestUploadUrl: vi.fn(() => Promise.resolve('https://upload.test/doc-1')),
      uploadContent: vi.fn(() => Promise.resolve()),
    };

    listContext = {
      listAssetDocuments: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetDocument()]))),
    };
    linkedContext = {
      listAssetLinkedFiles: vi.fn(() => Promise.resolve(makeLimitedList([]))),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetDocumentsContext.Provider
        value={{ now: () => Date.now(), createAssetDocumentService: () => listContext }}
      >
        <UseAssetLinkedFilesContext.Provider
          value={{ createAssetDocumentService: () => linkedContext }}
        >
          <QueryWrapper>
            <AssetContext.Provider value={client}>
              <DocumentFileContext.Provider value={files}>
                <NavigationStoreContext.Provider value={navigationStore}>
                  {children}
                </NavigationStoreContext.Provider>
              </DocumentFileContext.Provider>
            </AssetContext.Provider>
          </QueryWrapper>
        </UseAssetLinkedFilesContext.Provider>
      </UseAssetDocumentsContext.Provider>
    );
  });

  it('puts the upload control above the documents of the asset', async () => {
    render(<AssetDocuments />, { wrapper });

    const upload = screen.getByRole('region', { name: 'Upload documents' });
    const document = await screen.findByRole('heading', { name: 'Pump manual.pdf' });

    expect(upload.compareDocumentPosition(document)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('reads the documents and existing files of the asset it is given', async () => {
    render(<AssetDocuments />, { wrapper });
    await screen.findByRole('heading', { name: 'Pump manual.pdf' });

    expect(listContext.listAssetDocuments).toHaveBeenCalledWith(
      assetIdentifier,
      expect.any(Number),
    );
    expect(linkedContext.listAssetLinkedFiles).toHaveBeenCalledWith(
      assetIdentifier,
      expect.any(Number),
    );
  });
});
