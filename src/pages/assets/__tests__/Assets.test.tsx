import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetDetailsTabCountsContext } from '../../../__mocks__/assetDetailsTabCounts';
import { makeAssetListItem, makeAssetPage, makeInstanceDetails } from '../../../__mocks__/assets';
import { makeAssetsKPICountsContext } from '../../../__mocks__/assetsKPICounts';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeAssetDocument } from '../../../__mocks__/documents';
import { makeLimitedList } from '../../../__mocks__/lists';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { AssetTab } from '../../../enums/assetTab';
import {
  UseAssetDocumentsContext,
  type UseAssetDocumentsContextType,
} from '../../../hooks/assets/documents/useAssetDocuments';
import { DocumentFileContext } from '../../../hooks/assets/documents/useDocumentFileContext';
import { DocumentPreviewContext } from '../../../hooks/assets/documents/useDocumentPreview';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import {
  UseAssetDetailsContext,
  type UseAssetDetailsContextType,
} from '../../../hooks/assets/useAssetDetails';
import { UseAssetDetailsTabCountsContext } from '../../../hooks/assets/useAssetDetailsTabCounts';
import { UseAssetsContext, type UseAssetsContextType } from '../../../hooks/assets/useAssets';
import { UseAssetsKPICountsContext } from '../../../hooks/assets/useAssetsKPICounts';
import { DebounceContext, type DebounceDeps } from '../../../hooks/general/useDebouncedCallback';
import { useNavigationState } from '../../../hooks/general/useNavigationState';
import { NavigationProvider } from '../../../providers/general/NavigationProvider';
import type { StateSyncApi } from '../../../types/host';
import { Assets } from '../Assets';

const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

// Applies the typed search on the next tick instead of after the real pause.
const immediateDebounce: DebounceDeps = {
  setTimer: (callback) => setTimeout(callback, 0),
  clearTimer: (handle) => clearTimeout(handle),
};

describe(Assets.name, () => {
  let api: StateSyncApi;
  let assetsContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    assetsContext = {
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const detailsContext: UseAssetDetailsContextType = {
      getAssetDetails: vi.fn(() => Promise.resolve(makeInstanceDetails())),
    };
    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() => Promise.resolve(true)),
    };
    const tabCountsContext = makeAssetDetailsTabCountsContext();
    const registerCountsContext = makeAssetsKPICountsContext();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <DebounceContext.Provider value={immediateDebounce}>
        <UseAssetsContext.Provider value={assetsContext}>
          <UseAssetDetailsContext.Provider value={detailsContext}>
            <UseAssetDetailsTabCountsContext.Provider value={tabCountsContext}>
              <UseAssetsKPICountsContext.Provider value={registerCountsContext}>
                <QueryWrapper>
                  <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
                </QueryWrapper>
              </UseAssetsKPICountsContext.Provider>
            </UseAssetDetailsTabCountsContext.Provider>
          </UseAssetDetailsContext.Provider>
        </UseAssetsContext.Provider>
      </DebounceContext.Provider>
    );
  });

  it('shows the asset register when no asset is selected', async () => {
    render(<RegisterWithState api={api} />, { wrapper });

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('opens the asset restored from the shared link', async () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeAssetTab: AssetTab.PROPERTIES,
    });

    render(<RegisterWithState api={api} initialState={initialState} />, {
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

  it('returns to the register from the breadcrumb and syncs the cleared selection', async () => {
    const initialState = JSON.stringify({ selectedAsset });
    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cooling Water Pump',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Assets' }));

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeAssetTab: AssetTab.PROPERTIES,
        }),
      ),
    );
  });

  it('syncs a typed search to the host and searches for it', async () => {
    render(<RegisterWithState api={api} />, { wrapper });

    await userEvent.type(await screen.findByRole('searchbox', { name: 'Search assets' }), 'pump');

    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeAssetTab: AssetTab.PROPERTIES,
          searchQuery: 'pump',
        }),
      ),
    );
    await waitFor(() =>
      expect(assetsContext.searchAssets).toHaveBeenCalledWith(expect.anything(), 'pump'),
    );
  });

  it('restores the search from the shared link', async () => {
    const initialState = JSON.stringify({ searchQuery: 'pump' });

    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });

    expect(await screen.findByRole('searchbox', { name: 'Search assets' })).toHaveValue('pump');
    await waitFor(() =>
      expect(assetsContext.searchAssets).toHaveBeenCalledWith(expect.anything(), 'pump'),
    );
  });

  it('keeps the search when an asset is opened and closed', async () => {
    const initialState = JSON.stringify({
      selectedAsset,
      searchQuery: 'pump',
    });
    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });
    await screen.findByRole('heading', {
      level: 1,
      name: 'Cooling Water Pump',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Assets' }));

    expect(await screen.findByRole('searchbox', { name: 'Search assets' })).toHaveValue('pump');
  });

  it('pages forward and syncs the page to the host', async () => {
    vi.mocked(assetsContext.listAssets).mockResolvedValue(
      makeAssetPage([makeAssetListItem()], 'cursor-2'),
    );
    render(<RegisterWithState api={api} />, { wrapper });
    const nextButton = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(nextButton).toBeEnabled());

    await userEvent.click(nextButton);

    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    expect(assetsContext.listAssets).toHaveBeenLastCalledWith(expect.anything(), 'cursor-2');
    expect(api.syncInternalState).toHaveBeenLastCalledWith(
      JSON.stringify({
        selectedAsset: null,
        activeAssetTab: AssetTab.PROPERTIES,
        registerCursors: ['cursor-2'],
      }),
    );
  });

  it('restores the page of the register from the shared link', async () => {
    const initialState = JSON.stringify({
      registerCursors: ['cursor-2', 'cursor-3'],
    });

    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });

    expect(await screen.findByText('Page 3')).toBeInTheDocument();
    expect(assetsContext.listAssets).toHaveBeenCalledWith(expect.anything(), 'cursor-3');
  });

  it('goes back one page from a restored page', async () => {
    const initialState = JSON.stringify({
      registerCursors: ['cursor-2', 'cursor-3'],
    });
    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous page',
    });
    await waitFor(() => expect(previousButton).toBeEnabled());

    await userEvent.click(previousButton);

    expect(await screen.findByText('Page 2')).toBeInTheDocument();
    expect(assetsContext.listAssets).toHaveBeenLastCalledWith(expect.anything(), 'cursor-2');
  });

  it('goes back to the first page when the search changes', async () => {
    const initialState = JSON.stringify({ registerCursors: ['cursor-2'] });
    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });
    expect(await screen.findByText('Page 2')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'p');

    await waitFor(() =>
      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset: null,
          activeAssetTab: AssetTab.PROPERTIES,
          searchQuery: 'p',
        }),
      ),
    );
  });

  it('returns to the first page when a restored page cannot be loaded', async () => {
    vi.mocked(assetsContext.listAssets).mockImplementation((_asset, cursor) =>
      cursor ? Promise.reject(new Error('stale cursor')) : Promise.resolve(makeAssetPage()),
    );
    const initialState = JSON.stringify({ registerCursors: ['stale-cursor'] });
    render(<RegisterWithState api={api} initialState={initialState} />, {
      wrapper,
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Go to first page' }));

    expect(await screen.findByText('Page 1')).toBeInTheDocument();
  });

  it('lets a document preview open another asset in the register', async () => {
    // Arrange
    const user = userEvent.setup();
    const client = makeMockClient();
    const documentsContext: UseAssetDocumentsContextType = {
      listAssetDocuments: vi.fn(() => Promise.resolve(makeLimitedList([makeAssetDocument()]))),
    };
    const initialState = JSON.stringify({
      selectedAsset,
      activeAssetTab: AssetTab.DOCUMENTS,
    });
    function OpenOtherAssetButton() {
      const selectAsset = useNavigationState((store) => store.actions.selectAsset);
      return (
        <button
          onClick={() => selectAsset({ space: 'asset-instance-space', externalId: 'FLOC-200' })}
        >
          Go to other asset
        </button>
      );
    }
    render(
      <AssetContext.Provider value={client}>
        <DocumentFileContext.Provider value={{ requestUploadUrl: vi.fn(), uploadContent: vi.fn() }}>
          <UseAssetDocumentsContext.Provider value={documentsContext}>
            <DocumentPreviewContext.Provider value={() => <OpenOtherAssetButton />}>
              <RegisterWithState api={api} initialState={initialState} />
            </DocumentPreviewContext.Provider>
          </UseAssetDocumentsContext.Provider>
        </DocumentFileContext.Provider>
      </AssetContext.Provider>,
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
          activeAssetTab: AssetTab.PROPERTIES,
        }),
      ),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

function RegisterWithState({
  api,
  initialState,
}: {
  api: StateSyncApi | null;
  initialState?: string;
}) {
  return (
    <NavigationProvider api={api} initialState={initialState}>
      <Assets />
    </NavigationProvider>
  );
}
