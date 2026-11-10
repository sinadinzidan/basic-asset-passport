import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAssetDocumentsContext,
  type UseAssetDocumentsContextType,
} from '../../../hooks/assets/documents/useAssetDocuments';
import { DocumentFileClientContext } from '../../../hooks/assets/documents/useDocumentFileClient';
import { AssetDataClientContext } from '../../../hooks/assets/useAssetDataClient';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetDocument } from '../../../mocks/documents';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const details = {
  asset: makeInstanceDetails({ space: 'asset-space', externalId: 'FLOC-7' }),
  equipment: [],
};

describe(`${AssetDetailsTabs.name} documents`, () => {
  let listContext: UseAssetDocumentsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    listContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetDocuments: vi.fn(() => Promise.resolve([makeAssetDocument()])),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <AssetDataClientContext.Provider value={client}>
        <DocumentFileClientContext.Provider
          value={{
            requestUploadUrl: vi.fn(),
            uploadContent: vi.fn(),
          }}
        >
          <UseAssetDocumentsContext.Provider value={listContext}>
            <QueryWrapper>{children}</QueryWrapper>
          </UseAssetDocumentsContext.Provider>
        </DocumentFileClientContext.Provider>
      </AssetDataClientContext.Provider>
    );
  });

  it('lists the documents of the open asset on the documents tab', async () => {
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.DOCUMENTS}
        onTabChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(await screen.findByText('Pump manual.pdf')).toBeInTheDocument();
    expect(listContext.listAssetDocuments).toHaveBeenCalledWith(
      expect.anything(),
      { space: 'asset-space', externalId: 'FLOC-7' },
    );
  });

  it('switches to the documents tab when it is chosen', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <AssetDetailsTabs
        details={details}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={onTabChange}
      />,
      { wrapper },
    );

    await user.click(screen.getByRole('tab', { name: 'Documents' }));

    expect(onTabChange).toHaveBeenCalledWith(AssetEquipmentTab.DOCUMENTS);
  });
});
