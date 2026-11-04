import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatTile } from '../StatTile';

describe(StatTile.name, () => {
  it('shows the label and value', () => {
    render(<StatTile label="Operating" value={4} icon={<svg />} />);

    expect(screen.getByText('Operating')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('hides the decorative icon from assistive technology', () => {
    const { container } = render(
      <StatTile
        label="Operating"
        value="–"
        icon={<svg data-testid="icon" />}
      />,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toContainElement(
      screen.getByTestId('icon'),
    );
  });
});
