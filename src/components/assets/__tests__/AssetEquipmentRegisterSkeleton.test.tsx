import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetEquipmentRegisterSkeleton } from '../AssetEquipmentRegisterSkeleton';

describe(AssetEquipmentRegisterSkeleton.name, () => {
  it('announces that the asset is loading, as one busy status', () => {
    render(<AssetEquipmentRegisterSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(
      'Loading asset and equipment properties...',
    );
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('sketches the page header, the tab bar and a card of properties', () => {
    const { container } = render(<AssetEquipmentRegisterSkeleton />);

    expect(container.querySelector('h1')).toBeNull();
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThanOrEqual(12);
    expect(container.querySelectorAll('.property-cell')).toHaveLength(6);
    expect(container.querySelectorAll('[data-skeleton-tab]')).toHaveLength(5);
  });

  it('hides the placeholder shapes from assistive technology', () => {
    const { container } = render(<AssetEquipmentRegisterSkeleton />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
