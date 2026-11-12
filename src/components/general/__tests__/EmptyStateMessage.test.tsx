import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyStateMessage } from '../EmptyStateMessage';

describe(EmptyStateMessage.name, () => {
  it('shows the title and description', () => {
    render(<EmptyStateMessage title="Nothing here" description="Add some." />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add some.')).toBeInTheDocument();
  });

  it('takes the card outline, like the cards it stands beside', () => {
    render(<EmptyStateMessage title="Nothing here" description="Add some." />);

    expect(screen.getByText('Nothing here').closest('[data-slot="empty-state"]')).toHaveClass(
      'data-card',
    );
  });
});
