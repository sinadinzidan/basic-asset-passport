import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { EquipmentDetails } from '../EquipmentDetails';

describe(EquipmentDetails.name, () => {
  it('shows the equipment name, id and properties', () => {
    render(<EquipmentDetails equipment={makeInstanceDetails({ externalId: 'P-100' })} />);

    expect(screen.getByRole('heading', { name: 'Cooling Water Pump' })).toBeInTheDocument();
    expect(screen.getByText('Equipment ID: P-100')).toBeInTheDocument();
    expect(screen.getByText('Plant ID')).toBeInTheDocument();
  });

  it('pairs every property label with its value', () => {
    render(
      <EquipmentDetails
        equipment={makeInstanceDetails({
          properties: [
            {
              identifier: 'manufacturer',
              label: 'Manufacturer',
              value: 'Northwind',
            },
            {
              identifier: 'ratedPower',
              label: 'Rated power (kW)',
              value: '75',
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('Manufacturer').nextElementSibling).toHaveTextContent('Northwind');
    expect(screen.getByText('Rated power (kW)').nextElementSibling).toHaveTextContent('75');
  });

  it('falls back to the external id when the equipment has no name', () => {
    render(
      <EquipmentDetails equipment={makeInstanceDetails({ externalId: 'P-100', properties: [] })} />,
    );

    expect(screen.getByRole('heading', { name: 'P-100' })).toBeInTheDocument();
  });
});
