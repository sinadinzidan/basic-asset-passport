import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetDetailsSkeleton } from '../AssetDetailsSkeleton';

describe(AssetDetailsSkeleton.name, () => {
  it('announces that the asset is loading, as one busy status', () => {
    render(<AssetDetailsSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading asset and equipment properties...');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('sketches the page header, the tab bar and a card of properties', () => {
    const { container } = render(<AssetDetailsSkeleton />);

    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(12);
    expect(container.querySelectorAll('.property-cell')).toHaveLength(6);
    expect(container.querySelectorAll('[data-skeleton-tab]')).toHaveLength(5);
  });

  it('gives every tab but Properties a small placeholder for its count, as the loaded tabs carry badges', () => {
    const { container } = render(<AssetDetailsSkeleton />);

    const tabs = Array.from(container.querySelectorAll('[data-skeleton-tab]'));

    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.querySelectorAll('[data-skeleton-tab-badge]').length)).toEqual([
      0, 1, 1, 1, 1,
    ]);
  });

  it('starts the title row with the title, as the loaded page does: there is no back button to stand in for', () => {
    const { container } = render(<AssetDetailsSkeleton />);

    const titleRow = container.querySelector('.ml-auto')?.parentElement;
    const [firstShape] = Array.from(titleRow?.children ?? []);

    expect(firstShape).toHaveClass('h-9');
    expect(container.querySelector('.size-10')).toBeNull();
  });

  it('hides the placeholder shapes from assistive technology', () => {
    const { container } = render(<AssetDetailsSkeleton />);

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
