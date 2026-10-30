import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { AssetRecord } from '../../../types/asset';
import { AssetGrid } from '../AssetGrid';

const assets: AssetRecord[] = [
  { id: 1, space: 'asset_data', name: 'Feed pump', externalId: 'P-101', area: 'Utilities', description: 'Boiler feed' },
  { id: 2, name: 'Standby pump', externalId: 'P-102' },
];

describe('AssetGrid', () => {
  it('shows a card per asset with identifier, description and area', () => {
    render(<AssetGrid assets={assets} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Boiler feed')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('No description available.')).toBeInTheDocument();
    expect(screen.getByText('FP')).toBeInTheDocument();
  });

  it('opens an asset from its button or its card, and not an asset without a space', async () => {
    const user = userEvent.setup();
    const onAssetSelect = vi.fn();
    render(<AssetGrid assets={assets} onAssetSelect={onAssetSelect} />);
    await user.click(screen.getByRole('button', { name: 'Open Feed pump' }));
    await user.click(screen.getByText('Boiler feed'));
    expect(onAssetSelect).toHaveBeenCalledTimes(2);
    expect(onAssetSelect).toHaveBeenLastCalledWith({ space: 'asset_data', externalId: 'P-101', name: 'Feed pump' });
    expect(screen.queryByRole('button', { name: 'Open Standby pump' })).not.toBeInTheDocument();
  });
});
