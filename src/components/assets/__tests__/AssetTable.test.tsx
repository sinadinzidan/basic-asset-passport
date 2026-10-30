import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AssetRecord } from '../../../types/asset';
import { AssetTable } from '../AssetTable';

describe('Asset table', () => {
  it('lists every asset with identifier, plant area and initials', () => {
    render(<AssetTable assets={createAssets()} />);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('Feed pump')).toBeInTheDocument();
    expect(screen.getByText('P-102')).toBeInTheDocument();
    expect(screen.getByText('FP')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Plant area' })).toBeInTheDocument();
    expect(screen.getByText('Not provided')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('selects an asset that has a space and external ID', async () => {
    const user = userEvent.setup();
    const onAssetSelect = vi.fn();
    render(<AssetTable assets={createAssets()} onAssetSelect={onAssetSelect} />);
    await user.click(screen.getByRole('button', { name: 'Open Feed pump' }));
    expect(onAssetSelect).toHaveBeenCalledExactlyOnceWith({ space: 'asset_data', externalId: 'P-101', name: 'Feed pump' });
    expect(screen.queryByRole('button', { name: /Standby pump/ })).not.toBeInTheDocument();
  });

  it('selects an asset when its row is clicked', async () => {
    const user = userEvent.setup();
    const onAssetSelect = vi.fn();
    render(<AssetTable assets={createAssets()} onAssetSelect={onAssetSelect} />);
    await user.click(screen.getByText('Boiler feed'));
    expect(onAssetSelect).toHaveBeenCalledExactlyOnceWith({ space: 'asset_data', externalId: 'P-101', name: 'Feed pump' });
  });
});

function createAssets(): AssetRecord[] {
  return [
    { id: 1, space: 'asset_data', name: 'Feed pump', externalId: 'P-101', area: 'Utilities', description: 'Boiler feed' },
    { id: 2, name: 'Standby pump', externalId: 'P-102' },
  ];
}
