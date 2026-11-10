import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import {
  UseAssetDocumentsContext,
  type UseAssetDocumentsContextType,
} from '../../../hooks/assets/documents/useAssetDocuments';
import { DocumentFileClientContext } from '../../../hooks/assets/documents/useDocumentFileClient';
import { DocumentPreviewContext } from '../../../hooks/assets/documents/useDocumentPreview';
import { AssetDataClientContext } from '../../../hooks/assets/useAssetDataClient';
import {
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../../../hooks/assets/useAssetEquipmentDetails';
import {
  UseAssetsContext,
  type UseAssetsContextType,
} from '../../../hooks/assets/useAssets';
import { useOpenAsset } from '../../../hooks/assets/useOpenAsset';
import {
  DebounceContext,
  type DebounceDeps,
} from '../../../hooks/general/useDebouncedCallback';
import { makeAssetPage, makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeAssetDocument } from '../../../mocks/documents';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { StateSyncApi } from '../../../types/host';
import { AssetRegister } from '../AssetRegister';

const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

// Applies the typed search on the next tick instead of after the real pause.
const immediateDebounce: DebounceDeps = {
  setTimer: (callback) => setTimeout(callback, 0),
  clearTimer: (handle) => clearTimeout(handle),
};

describe(AssetRegister.name, () => {
  let api: StateSyncApi;
  let assetsContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    assetsContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const detailsContext: UseAssetEquipmentDetailsContextType = {
      useAssetDataClient: vi.fn(() => client),
      getAssetEquipmentDetails: vi.fn(() =>
        Promise.resolve({ asset: makeInstanceDetails(), equipment: [] }),
      ),
    };
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() =>
        Promise.resolve(true),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <DebounceContext.Provider value={immediateDebounce}>
        <UseAssetsContext.Provider value={assetsContext}>
          <UseAssetEquipmentDetailsContext.Provider value={detailsContext}>
            <QueryWrapper>{children}</QueryWrapper>
          </UseAssetEquipmentDetailsContext.Provider>
        </UseAssetsContext.Provider>
      </DebounceContext.Provider>
    );
  });

  it('shows the asset register when no asset is selected', async () => {
    render(<AssetRegister api={api} />, { wrapper });

    expect(
      await screen.findByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('opens the asset restored from the shared link', async () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    });

    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Cooling Water Pump',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('returns to the register and syncs the cleared selection', async () => {
    const initialState = JSON.stringify({ selectedAsset });
    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cooling Water Pump',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to assets' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
        }),
      ),
    );
  });

  it('syncs a typed search to the host and searches for it', async () => {
    render(<AssetRegister api={api} />, { wrapper });

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Search assets' }),
      'pump',
    );

    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
          searchQuery: 'pump',
        }),
      ),
    );
    await waitFor(() =>
      expect(assetsContext.searchAssets).toHaveBeenCalledWith(
        expect.anything(),
        'pump',
      ),
    );
  });

  it('restores the search from the shared link', async () => {
    const initialState = JSON.stringify({ searchQuery: 'pump' });

    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });

    expect(
      await screen.findByRole('searchbox', { name: 'Search assets' }),
    ).toHaveValue('pump');
    await waitFor(() =>
      expect(assetsContext.searchAssets).toHaveBeenCalledWith(
        expect.anything(),
        'pump',
      ),
    );
  });

  it('keeps the search when an asset is opened and closed', async () => {
    const initialState = JSON.stringify({
      selectedAsset,
      searchQuery: 'pump',
    });
    render(<AssetRegister api={api} initialState={initialState} />, {
      wrapper,
    });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cooling Water Pump',
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Back to assets' }),
    );

    expect(
      await screen.findByRole('searchbox', { name: 'Search assets' }),
    ).toHaveValue('pump');
  });

  it('lets a document preview open another asset in the register', async () => {
    // Arrange
    const user = userEvent.setup();
    const client = makeMockClient();
    const documentsContext: UseAssetDocumentsContextType = {
      useAssetDataClient: vi.fn(() => client),
      listAssetDocuments: vi.fn(() => Promise.resolve([makeAssetDocument()])),
    };
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.DOCUMENTS,
    });
    function OpenOtherAssetButton() {
      const openAsset = useOpenAsset();
      return (
        <button
          onClick={() =>
            openAsset?.({ space: 'asset-instance-space', externalId: 'FLOC-200' })
          }
        >
          Go to other asset
        </button>
      );
    }
    render(
      <AssetDataClientContext.Provider value={client}>
        <DocumentFileClientContext.Provider
          value={{ requestUploadUrl: vi.fn(), uploadContent: vi.fn() }}
        >
          <UseAssetDocumentsContext.Provider value={documentsContext}>
            <DocumentPreviewContext.Provider value={() => <OpenOtherAssetButton />}>
              <AssetRegister api={api} initialState={initialState} />
            </DocumentPreviewContext.Provider>
          </UseAssetDocumentsContext.Provider>
        </DocumentFileClientContext.Provider>
      </AssetDataClientContext.Provider>,
      { wrapper },
    );

    // Act
    await user.click(await screen.findByRole('button', { name: 'View Pump manual.pdf' }));
    await user.click(await screen.findByRole('button', { name: 'Go to other asset' }));

    // Assert
    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: { space: 'asset-instance-space', externalId: 'FLOC-200' },
          activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
        }),
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
