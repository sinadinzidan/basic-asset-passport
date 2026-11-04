import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GlassCard } from '../GlassCard';

describe(GlassCard.name, () => {
  it('combines the card style with extra classes and passes props through', () => {
    render(
      <GlassCard className="p-4" data-testid="card">
        content
      </GlassCard>,
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('glass-card', 'p-4');
    expect(card).toHaveTextContent('content');
  });
});
