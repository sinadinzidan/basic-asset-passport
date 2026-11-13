import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PropertyGrid } from '../PropertyGrid';

describe(PropertyGrid.name, () => {
  it('lists each property label with its value', () => {
    render(
      <PropertyGrid
        properties={[
          { identifier: 'name', label: 'Name', value: 'Pump' },
          { identifier: 'plantId', label: 'Plant ID', value: 'G307' },
        ]}
      />,
    );

    expect(screen.getByText('Name').nextSibling).toHaveTextContent('Pump');
    expect(screen.getByText('Plant ID').nextSibling).toHaveTextContent('G307');
  });

  it('renders an empty list without properties', () => {
    const { container } = render(<PropertyGrid properties={[]} />);

    expect(container.querySelectorAll('dt')).toHaveLength(0);
  });
});
