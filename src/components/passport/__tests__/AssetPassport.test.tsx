import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PassportTab } from '../../../enums/passportTab';
import type { AssetPassportRecord } from '../../../types/passport';
import { AssetPassport } from '../AssetPassport';

describe('Asset passport', () => {
  it('uses two tabs and shows the specifications and documents in their own tab', async () => {
    const user = userEvent.setup();
    renderPassport();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Overview', 'Documents0']);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    // Aura wraps the count in its own badge; a second Badge inside it renders a box in a box with unreadable text.
    expect(screen.getByRole('tab', { name: /^Documents/ }).querySelectorAll('[data-slot="badge"]')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Identity & specifications' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(screen.getByRole('heading', { name: 'Documents & certificates' })).toBeInTheDocument();
  });

  it('shows no document count while the files are pending', () => {
    renderPassport({ isDocumentsPending: true });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Overview', 'Documents']);
    expect(screen.getByText('Documents', { selector: 'dt' }).nextElementSibling).toHaveTextContent('Loading');
  });

  it('keeps identical specification labels apart without duplicate-key problems', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPassport({ passports: [createPassport({ specifications: [{ label: 'Tag number', value: 'A' }, { label: 'Tag number', value: 'B' }] })] });
    expect(screen.getAllByText('Tag number').length).toBeGreaterThanOrEqual(2);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('renders identity from live fields only', () => {
    renderPassport();
    expect(screen.getByRole('heading', { name: /Drive motor/ })).toBeInTheDocument();
    expect(screen.getByText('Pump motor')).toBeInTheDocument();
    expect(screen.getByText('Plant A / Area 10')).toBeInTheDocument();
    expect(screen.getAllByText('ABB')).toHaveLength(2);
    expect(screen.getAllByText('10-M-101')).toHaveLength(2);
    expect(screen.queryByText(/health|availability|work order|spare|cost/i)).not.toBeInTheDocument();
  });

  it('shows messages instead of invented values when fields are missing', () => {
    renderPassport({ passports: [createPassport({ asset: { id: 'bare', name: 'Bare motor' }, location: '', specifications: [] })] });
    expect(screen.getByText('No description available.')).toBeInTheDocument();
    expect(screen.getByText('No specifications available')).toBeInTheDocument();
    expect(screen.queryByText('Plant A / Area 10')).not.toBeInTheDocument();
  });

  it('switches equipment and keeps the active tab', async () => {
    const user = userEvent.setup();
    renderPassport({ passports: [createPassport(), createPassport({ asset: { id: 'pump-1', name: 'Drive pump', externalId: 'P-1' }, specifications: [{ label: 'Tag number', value: '10-P-1' }] })] });
    const equipment = screen.getByRole('navigation', { name: 'Choose equipment' });
    await user.click(within(equipment).getByRole('button', { name: /Drive pump/ }));
    expect(screen.getByRole('heading', { name: /Drive pump/ })).toBeInTheDocument();
    expect(screen.getAllByText('10-P-1').length).toBeGreaterThan(0);
    expect(screen.queryByText('10-M-101')).not.toBeInTheDocument();
    expect(within(equipment).getByRole('button', { name: /Drive pump/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens linked documents through the file viewer callback', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    renderPassport({ onFileSelect, passports: [createPassport({ documents: [
      { id: 'DOC-1', title: 'Motor datasheet', revision: 'B', date: '2026-01-02', origin: 'Equipment file', instanceId: { space: 'files', externalId: 'DOC-1' } },
    ] })] });
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(screen.getByText('DOC-1 · Rev B · 2026-01-02 · Equipment file')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Motor datasheet/ }));
    expect(onFileSelect).toHaveBeenCalledWith({ space: 'files', externalId: 'DOC-1', name: 'Motor datasheet' });
  });

  it('shows the documents empty message and any notice', async () => {
    const user = userEvent.setup();
    renderPassport({ documentsEmptyMessage: 'No files linked to this equipment or its asset' });
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(screen.getByText('No files linked to this equipment or its asset')).toBeInTheDocument();
  });

  it('keeps asset-only files in the Documents tab when there is no equipment', async () => {
    const user = userEvent.setup();
    renderPassport({ passports: [], emptyContent: <p>Asset documents</p>,
      emptyMessage: 'No equipment linked to this asset' });
    expect(screen.getByText('No equipment linked to this asset')).toBeInTheDocument();
    expect(screen.queryByText('Asset documents')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(screen.getByText('Asset documents')).toBeInTheDocument();
  });

  it('shows tags and key facts from the specifications and no equipment switcher for one item', () => {
    renderPassport({ passports: [createPassport({ specifications: [
      { label: 'Manufacturer', value: 'ABB' }, { label: 'Class', value: 'Motor' }, { label: 'Facility', value: 'Plant A' },
    ] })] });
    expect(within(screen.getByRole('list', { name: 'Tags' })).getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(['Class: Motor', 'Facility: Plant A']);
    expect(within(screen.getByRole('complementary', { name: 'Equipment summary' })).getByText('Manufacturer')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Choose equipment' })).not.toBeInTheDocument();
    expect(screen.getByText('Equipment on Feed pump')).toBeInTheDocument();
  });

  it('summarises the equipment at a glance in the hero', () => {
    renderPassport({ passports: [createPassport({ documents: [
      { id: 'D', title: 'Datasheet', revision: 'A', date: '2026-01-01', origin: 'Equipment file', instanceId: { space: 'files', externalId: 'D' } },
    ] })] });
    const stats = within(screen.getByLabelText('At a glance'));
    expect(stats.getByText('Specifications').nextSibling).toHaveTextContent('2');
    expect(stats.getByText('Documents').nextSibling).toHaveTextContent('1');
    expect(stats.getByText('Equipment on asset').nextSibling).toHaveTextContent('1');
  });

  it('gives the tabs the full width when there is nothing for the summary column', () => {
    renderPassport({ passports: [createPassport({ specifications: [{ label: 'Source id', value: 'WMT:1' }] })] });
    expect(screen.queryByRole('complementary', { name: 'Equipment summary' })).not.toBeInTheDocument();
    expect(screen.getByText('WMT:1')).toBeInTheDocument();
  });

  it('shows the asset, a no-equipment badge and a way to the asset files when there is no equipment', async () => {
    const user = userEvent.setup();
    renderPassport({ passports: [], emptyContent: <p>Asset documents</p>, assetFilesCount: 2 });
    expect(screen.getByRole('heading', { name: 'Feed pump' })).toBeInTheDocument();
    expect(screen.getByText('No equipment linked')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Documents 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View asset files' }));
    expect(screen.getByText('Asset documents')).toBeInTheDocument();
    expect(screen.getByText(/Read-only view of CDF data/)).toBeInTheDocument();
  });
});

function createPassport(overrides: Partial<AssetPassportRecord> = {}): AssetPassportRecord {
  return {
    asset: { id: 'motor-1', name: 'Drive motor', externalId: 'M-101', description: 'Pump motor', area: 'Area 10' },
    location: 'Plant A / Area 10',
    specifications: [{ label: 'Manufacturer', value: 'ABB' }, { label: 'Tag number', value: '10-M-101' }],
    documents: [],
    ...overrides,
  };
}

function renderPassport(props: Partial<ComponentProps<typeof AssetPassport>> = {}) {
  function Harness() {
    const [activeTab, setActiveTab] = useState<PassportTab>(PassportTab.OVERVIEW);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>();
    return (
      <AssetPassport
        passports={[createPassport()]}
        assetName="Feed pump"
        assetExternalId="A-1"
        directoryNote="Names, tags, specifications and files come from CDF."
        emptyMessage="No equipment linked to this asset"
        onFileSelect={vi.fn()}
        {...props}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedEquipmentId={selectedEquipmentId}
        onEquipmentSelect={setSelectedEquipmentId}
      />
    );
  }
  return render(<Harness />);
}
