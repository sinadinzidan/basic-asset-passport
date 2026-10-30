import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PassportTab } from '../../../enums/passportTab';
import { NoEquipmentPassport } from '../NoEquipmentPassport';

describe('NoEquipmentPassport', () => {
  it('shows the asset, the no-equipment explanation and a way to its files', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<NoEquipmentPassport assetName="Dry gas seal" assetExternalId="WMT:23" emptyMessage="No equipment linked to this asset" directoryNote="Note." assetFiles={<p>Files</p>}
      assetFilesCount={3} activeTab={PassportTab.OVERVIEW} onTabChange={onTabChange} />);
    expect(screen.getByRole('heading', { name: 'Dry gas seal' })).toBeInTheDocument();
    expect(screen.getByText('WMT:23')).toBeInTheDocument();
    expect(screen.getByText('No equipment linked')).toBeInTheDocument();
    expect(screen.getByText('No equipment linked to this asset')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents 3' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View asset files' }));
    expect(onTabChange).toHaveBeenCalledWith(PassportTab.DOCUMENTS);
  });

  it('shows the asset files on the Documents tab and no count while it is unknown', () => {
    render(<NoEquipmentPassport assetName="Dry gas seal" assetExternalId="WMT:23" emptyMessage="None." directoryNote="Note." assetFiles={<p>Files</p>}
      activeTab={PassportTab.DOCUMENTS} onTabChange={vi.fn()} />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
  });

  it('uses the same hero stats and card shape as the equipment page, with the empty state inside the card', () => {
    render(<NoEquipmentPassport assetName="Dry gas seal" assetExternalId="WMT:23" emptyMessage="No equipment linked to this asset" directoryNote="Note." assetFiles={<p>Files</p>}
      assetFilesCount={3} activeTab={PassportTab.OVERVIEW} onTabChange={vi.fn()} />);
    const stats = within(screen.getByLabelText('At a glance'));
    expect(stats.getByText('Specifications').nextSibling).toHaveTextContent('0');
    expect(stats.getByText('Documents').nextSibling).toHaveTextContent('3');
    expect(stats.getByText('Equipment on asset').nextSibling).toHaveTextContent('0');
    // The card keeps its header, like the equipment page's Overview card, instead of a bare full-size message.
    expect(screen.getByRole('heading', { name: 'Identity & specifications' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No equipment linked to this asset');
  });

  it('shows no document count in the hero while the files are still loading', () => {
    render(<NoEquipmentPassport assetName="Dry gas seal" assetExternalId="WMT:23" emptyMessage="None" directoryNote="Note." assetFiles={<p>Files</p>}
      activeTab={PassportTab.OVERVIEW} onTabChange={vi.fn()} />);
    expect(within(screen.getByLabelText('At a glance')).getByText('Documents').nextSibling).toHaveTextContent('…');
  });
});
