import type { ColumnDef } from '@cognite/aura/data-grid';
import type { Row } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { UseAssetsContext, type UseAssetsContextType } from '../../../hooks/assets/useAssets';
import { UseAssetsKPICountsContext } from '../../../hooks/assets/useAssetsKPICounts';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { makeAssetListItem, makeAssetPage } from '../../../mocks/assets';
import { makeAssetsKPICountsContext } from '../../../mocks/assetsKPICounts';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeNavigationStore } from '../../../mocks/navigation';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import type { AssetListItem } from '../../../types/asset';
import { AssetTable } from '../AssetTable';

const assetContext = makeMockClient();

type GridStubProps = {
  data: AssetListItem[];
  columns: ColumnDef<AssetListItem>[];
  onRowClick: (row: Row<AssetListItem>) => void;
};

// Aura's DataGrid is virtualised and renders no data rows without real layout,
// which Happy DOM does not provide. This stub renders one button per row so the
// row-selection wiring of AssetTable can still be verified.
vi.mock('@cognite/aura/data-grid', () => ({
  DataGrid: ({ data, onRowClick }: GridStubProps) => (
    <div>
      {data.map((asset) => (
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

describe('AssetTable row selection', () => {
  let mockContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  const store = makeNavigationStore();

  beforeEach(() => {
    mockContext = {
      listAssets: vi.fn(() =>
        Promise.resolve(
          makeAssetPage([makeAssetListItem({ space: 'asset-space', externalId: 'FLOC-7' })]),
        ),
      ),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const QueryWrapper = makeQueryClientWrapper();
    const countsContext = makeAssetsKPICountsContext();
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <UseAssetsContext.Provider value={mockContext}>
          <UseAssetsKPICountsContext.Provider value={countsContext}>
            <QueryWrapper>
              <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
            </QueryWrapper>
          </UseAssetsKPICountsContext.Provider>
        </UseAssetsContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('selects the clicked asset', async () => {
    render(<AssetTable />, { wrapper });

    await userEvent.click(await screen.findByRole('button', { name: 'FLOC-7' }));

    expect(store.getState().navigationState.selectedAsset).toEqual({
      space: 'asset-space',
      externalId: 'FLOC-7',
    });
  });
});
