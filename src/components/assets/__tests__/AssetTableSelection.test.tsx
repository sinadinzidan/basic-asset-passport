import type { ColumnDef } from '@cognite/aura/data-grid';
import type { Row } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAssetsContext,
  type UseAssetsContextType,
} from '../../../hooks/assets/useAssets';
import { makeAssetListItem, makeAssetPage } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AssetListItem } from '../../../types/asset';
import { AssetTable } from '../AssetTable';

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
            onRowClick({ original: asset } as Partial<
              Row<AssetListItem>
            > as Row<AssetListItem>)
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

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      listAssets: vi.fn(() =>
        Promise.resolve(
          makeAssetPage([
            makeAssetListItem({ space: 'asset-space', externalId: 'FLOC-7' }),
          ]),
        ),
      ),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetsContext.Provider>
    );
  });

  it('reports the identifier of the clicked asset', async () => {
    const onAssetSelect = vi.fn();
    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );

    await userEvent.click(
      await screen.findByRole('button', { name: 'FLOC-7' }),
    );

    expect(onAssetSelect).toHaveBeenCalledWith({
      space: 'asset-space',
      externalId: 'FLOC-7',
    });
  });
});
