import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NO_TAB_COUNTS } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../__mocks__/documents';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { DOCUMENT_QUERY_LIMIT } from '../../../constants/documents';
import { AssetTab } from '../../../enums/assetTab';
import { UseAssetDocumentsContext } from '../../../hooks/assets/documents/useAssetDocuments';
import { DocumentFileContext } from '../../../hooks/assets/documents/useDocumentFileContext';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetDocumentService } from '../../../services/assets/documents/assetDocument';
import type { NavigationStore } from '../../../types/navigation';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const asset = makeInstanceDetails({
  space: 'asset-space',
  externalId: 'FLOC-7',
});

describe(`${AssetDetailsTabs.name} documents`, () => {
  let listContext: Pick<AssetDocumentService, 'listAssetDocuments'>;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
    });
    const client = makeMockClient();

    listContext = {
      listAssetDocuments: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetDocument()]))),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <AssetContext.Provider value={client}>
          <DocumentFileContext.Provider
            value={{
              requestUploadUrl: vi.fn(),
              uploadContent: vi.fn(),
            }}
          >
            <UseAssetDocumentsContext.Provider
              value={{ createAssetDocumentService: () => listContext }}
            >
              <QueryWrapper>
                <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
              </QueryWrapper>
            </UseAssetDocumentsContext.Provider>
          </DocumentFileContext.Provider>
        </AssetContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('lists the documents of the open asset on the documents tab', async () => {
    store = makeNavigationStore({
      selectedAsset: { space: asset.space, externalId: asset.externalId },
      activeAssetTab: AssetTab.DOCUMENTS,
    });
    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByText('Pump manual.pdf')).toBeInTheDocument();
    expect(listContext.listAssetDocuments).toHaveBeenCalledWith(
      { space: 'asset-space', externalId: 'FLOC-7' },
      DOCUMENT_QUERY_LIMIT,
    );
  });

  it('switches to the documents tab when it is chosen', async () => {
    const user = userEvent.setup();

    render(<AssetDetailsTabs asset={asset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    await user.click(screen.getByRole('tab', { name: 'Documents' }));

    expect(store.getState().navigationState.activeAssetTab).toBe(AssetTab.DOCUMENTS);
    expect(await screen.findByText('Pump manual.pdf')).toBeInTheDocument();
  });
});
