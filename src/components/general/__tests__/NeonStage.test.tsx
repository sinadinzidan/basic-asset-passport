import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NeonStage } from '../NeonStage';

describe(NeonStage.name, () => {
  it('shows its children on the stage', () => {
    const { container } = render(<NeonStage>Stage content</NeonStage>);

    expect(screen.getByText('Stage content')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('neon-stage');
  });

  it('hides the decorative glows from assistive technology', () => {
    const { container } = render(<NeonStage>Content</NeonStage>);

    const orbs = container.querySelectorAll('.neon-orb');
    expect(orbs).toHaveLength(2);
    orbs.forEach((orb) => expect(orb).toHaveAttribute('aria-hidden', 'true'));
  });
});
