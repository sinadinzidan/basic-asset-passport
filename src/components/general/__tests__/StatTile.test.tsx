import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatTile } from '../StatTile';

describe(StatTile.name, () => {
  it('shows the label and value', () => {
    render(<StatTile label="Operating" value={4} icon={<svg />} />);

    expect(screen.getByText('Operating')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('groups the value under its label for assistive technology', () => {
    render(<StatTile label="Operating" value={4} icon={<svg />} />);

    expect(screen.getByRole('group', { name: 'Operating' })).toHaveTextContent('4');
  });

  it('is a notched card with a vent', () => {
    const { container } = render(<StatTile label="Operating" value={4} icon={<svg />} />);

    expect(container.firstElementChild).toHaveClass('hud-notched');
    expect(container.querySelector('.hud-vent')).not.toBeNull();
  });

  it('heads the card with the label, marked by a diamond', () => {
    const { container } = render(<StatTile label="Operating" value={4} icon={<svg />} />);

    const heading = container.querySelector('.stat-tile__head');

    expect(heading).toContainElement(screen.getByText('Operating'));
    expect(heading?.querySelector('.hud-dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('hides the decorative icon from assistive technology', () => {
    render(<StatTile label="Operating" value="–" icon={<svg data-testid="icon" />} />);

    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });
});
