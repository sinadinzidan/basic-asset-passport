import type { CellContext } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeAssetListItem } from '../../../mocks/assets';
import type { AssetListItem } from '../../../types/asset';
import { ASSET_COLUMNS } from '../assetColumns';

function renderCell(columnIndex: number, asset: AssetListItem) {
  const context = {
    row: { original: asset },
  } as Partial<CellContext<AssetListItem, unknown>> as CellContext<
    AssetListItem,
    unknown
  >;

  return render(<>{flexRender(ASSET_COLUMNS[columnIndex].cell, context)}</>);
}

describe('ASSET_COLUMNS', () => {
  it('lists the columns in display order', () => {
    const keys = ASSET_COLUMNS.map((column) =>
      'accessorKey' in column ? column.accessorKey : undefined,
    );

    expect(keys).toEqual([
      'plantName',
      'externalId',
      'name',
      'description',
      'flocStatus',
      'abcIndicatorName',
    ]);
  });

  it('shows the values of a complete asset', () => {
    const asset = makeAssetListItem();

    renderCell(0, asset);
    renderCell(1, asset);
    renderCell(2, asset);
    renderCell(3, asset);
    renderCell(5, asset);

    expect(screen.getByText('North Plant')).toBeInTheDocument();
    expect(screen.getByText('FLOC-100')).toBeInTheDocument();
    expect(screen.getByText('Cooling Water Pump')).toBeInTheDocument();
    expect(
      screen.getByText('North process cooling system'),
    ).toBeInTheDocument();
    expect(screen.getByText('A - High criticality')).toBeInTheDocument();
  });

  it('labels missing values instead of leaving cells blank', () => {
    const asset = makeAssetListItem({
      plantName: null,
      name: null,
      description: null,
      abcIndicatorName: null,
    });

    renderCell(0, asset);
    renderCell(2, asset);
    renderCell(3, asset);
    renderCell(5, asset);

    expect(screen.getAllByText('Not provided')).toHaveLength(2);
    expect(screen.getByText('Unnamed asset')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows an Operating status with the success style', () => {
    renderCell(4, makeAssetListItem({ flocStatus: 'Operating' }));

    expect(screen.getByText('Operating')).toHaveClass(
      'bg-success-foreground-strong',
    );
  });

  it('shows any other status without the success style', () => {
    renderCell(4, makeAssetListItem({ flocStatus: 'IN SERVICE' }));

    expect(screen.getByText('IN SERVICE')).not.toHaveClass(
      'bg-success-foreground-strong',
    );
  });

  it('says the status is not provided when it is missing', () => {
    renderCell(4, makeAssetListItem({ flocStatus: null }));

    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });
});
