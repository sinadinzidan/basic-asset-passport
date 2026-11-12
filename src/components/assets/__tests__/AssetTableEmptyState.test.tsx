import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ASSETS_EMPTY_DESCRIPTION,
  ASSETS_EMPTY_TITLE,
  ASSETS_NO_MATCH_TITLE,
} from '../../../constants/assets';
import { formatNoMatchingAssetsMessage } from '../../../lib/assetMessage';
import { AssetTableEmptyState } from '../AssetTableEmptyState';

describe(AssetTableEmptyState.name, () => {
  it('says there are no assets when nothing is searched for', () => {
    render(<AssetTableEmptyState searchQuery="" />);

    expect(screen.getByText(ASSETS_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(ASSETS_EMPTY_DESCRIPTION)).toBeInTheDocument();
  });

  it('names the search that matched nothing', () => {
    render(<AssetTableEmptyState searchQuery="pump" />);

    expect(screen.getByText(ASSETS_NO_MATCH_TITLE)).toBeInTheDocument();
    expect(screen.getByText(formatNoMatchingAssetsMessage('pump'))).toBeInTheDocument();
  });

  it('sits in a grid cell, so the heading is allowed inside the grid', () => {
    render(
      <div role="grid">
        <AssetTableEmptyState searchQuery="pump" />
      </div>,
    );

    const cell = within(screen.getByRole('row')).getByRole('gridcell');
    expect(within(cell).getByText(ASSETS_NO_MATCH_TITLE)).toBeInTheDocument();
  });
});
