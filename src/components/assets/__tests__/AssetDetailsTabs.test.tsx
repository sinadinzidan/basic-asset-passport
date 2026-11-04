import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AssetEquipmentTab } from '../../../enums/assetEquipmentTab';
import { makeInstanceDetails } from '../../../mocks/assets';
import type { AssetEquipmentDetails } from '../../../types/asset';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

function makeDetails(equipmentCount: number): AssetEquipmentDetails {
  return {
    asset: makeInstanceDetails({
      properties: [{ identifier: 'plantId', label: 'Plant ID', value: 'G307' }],
    }),
    equipment: Array.from({ length: equipmentCount }, (_, index) =>
      makeInstanceDetails({ externalId: `P-${index + 1}`, properties: [] }),
    ),
  };
}

describe(AssetDetailsTabs.name, () => {
  it('shows the asset properties on the properties tab', () => {
    render(
      <AssetDetailsTabs
        details={makeDetails(0)}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Properties' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Plant ID')).toBeInTheDocument();
  });

  it('lists every linked equipment on the equipments tab', () => {
    render(
      <AssetDetailsTabs
        details={makeDetails(2)}
        activeTab={AssetEquipmentTab.EQUIPMENTS}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Equipment ID: P-1')).toBeInTheDocument();
    expect(screen.getByText('Equipment ID: P-2')).toBeInTheDocument();
  });

  it('shows an empty state when no equipment is linked', () => {
    render(
      <AssetDetailsTabs
        details={makeDetails(0)}
        activeTab={AssetEquipmentTab.EQUIPMENTS}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByText('No equipment linked')).toBeInTheDocument();
  });

  it('shows the equipment count on its tab', () => {
    render(
      <AssetDetailsTabs
        details={makeDetails(3)}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: /equipments/i })).toHaveTextContent(
      '3',
    );
  });

  it('reports the tab the user selects', async () => {
    const onTabChange = vi.fn();
    render(
      <AssetDetailsTabs
        details={makeDetails(1)}
        activeTab={AssetEquipmentTab.PROPERTIES}
        onTabChange={onTabChange}
      />,
    );

    await userEvent.click(screen.getByRole('tab', { name: /equipments/i }));

    expect(onTabChange).toHaveBeenCalledWith(AssetEquipmentTab.EQUIPMENTS);
  });
});
