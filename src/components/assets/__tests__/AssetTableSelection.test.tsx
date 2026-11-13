import type { ColumnDef } from '@cognite/aura/data-grid';
import type { QueryClient } from '@tanstack/react-query';
import type { Row } from '@tanstack/react-table';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { makeAssetListItem, makeAssetPage } from '../../../__mocks__/assets';
import { makeAssetSummaryContext } from '../../../__mocks__/assetSummary';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper, makeTestQueryClient } from '../../../__mocks__/QueryClientWrapper';
import { ASSET_SEARCH_LIMIT } from '../../../constants/assets';
import { AssetClientContext } from '../../../hooks/assets/useAssetClient';
import { UseAssetsContext } from '../../../hooks/assets/useAssets';
import { UseAssetSummaryContext } from '../../../hooks/assets/useAssetSummary';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import type { AssetService } from '../../../services/assets/asset';
import type { AssetListItem } from '../../../types/asset';
import type { NavigationState, NavigationStore } from '../../../types/navigation';
import { AssetTable } from '../AssetTable';

const assetContext = makeMockClient();

type GridStubProps = {
  data: AssetListItem[];
  loading: boolean;
  columns: ColumnDef<AssetListItem>[];
  onRowClick: (row: Row<AssetListItem>) => void;
};

// Aura's DataGrid is virtualised and renders no data rows without real layout,
// which Happy DOM does not provide. This stub renders one button per row so the
// rows AssetTable hands to the grid can still be verified. While the grid is told
// to load it shows skeletons in place of its rows, which the stub does too.
vi.mock('@cognite/aura/data-grid', () => ({
  DataGrid: ({ data, loading, onRowClick }: GridStubProps) => (
    <div>
      {(loading ? [] : data).map((asset) => (
        <button
          key={asset.externalId}
          onClick={() =>
            onRowClick({ original: asset } as Partial<Row<AssetListItem>> as Row<AssetListItem>)
          }
        >
          {asset.externalId}
        </button>
      ))}
    </div>
  ),
}));

describe('AssetTable rows', () => {
  let mockContext: AssetService;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockContext = {
      listAssets: vi.fn(() =>
        Promise.resolve(
          makeAssetPage([makeAssetListItem({ space: 'asset-space', externalId: 'FLOC-7' })]),
        ),
      ),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    store = makeNavigationStore();
    queryClient = makeTestQueryClient();
    const QueryWrapper = makeQueryClientWrapper(queryClient);
    const countsContext = makeAssetSummaryContext();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetsContext.Provider value={{ createAssetService: () => mockContext }}>
          <UseAssetSummaryContext.Provider
            value={{ createAssetSummaryService: () => countsContext }}
          >
            <QueryWrapper>
              <AssetClientContext.Provider value={assetContext}>
                {children}
              </AssetClientContext.Provider>
            </QueryWrapper>
          </UseAssetSummaryContext.Provider>
        </UseAssetsContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('selects the clicked asset', async () => {
    renderTable();

    await userEvent.click(await screen.findByRole('button', { name: 'FLOC-7' }));

    expect(store.getState().navigationState.selectedAsset).toEqual({
      space: 'asset-space',
      externalId: 'FLOC-7',
    });
  });

  it('keeps the rows while the assets are read again in the background', async () => {
    renderTable();
    expect(await screen.findByRole('button', { name: 'FLOC-7' })).toBeInTheDocument();
    vi.mocked(mockContext.listAssets).mockReturnValue(new Promise(() => {}));

    void queryClient.invalidateQueries();

    await waitFor(() => expect(mockContext.listAssets).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'FLOC-7' })).toBeInTheDocument();
  });

  it('does not say the search is cut short when exactly the limit matched', async () => {
    const items = Array.from({ length: ASSET_SEARCH_LIMIT }, (_item, index) =>
      makeAssetListItem({ externalId: `FLOC-${index}` }),
    );

    vi.mocked(mockContext.searchAssets).mockResolvedValue(makeAssetPage(items));

    renderTable({ searchQuery: 'pump' });

    expect(await screen.findByRole('button', { name: 'FLOC-0' })).toBeInTheDocument();
    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument();
  });

  function renderTable(navigationState: Partial<NavigationState> = {}) {
    store = makeNavigationStore(navigationState);

    return render(<AssetTable />, { wrapper });
  }
});
