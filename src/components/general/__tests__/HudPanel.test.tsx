import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HudPanel } from '../HudPanel';

describe(HudPanel.name, () => {
  it('shows its content', () => {
    render(<HudPanel>Panel content</HudPanel>);

    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('uses the cyan tone unless another is given', () => {
    const { container, rerender } = render(<HudPanel>Content</HudPanel>);
    expect(container.firstElementChild).toHaveClass('tone-cyan');

    rerender(<HudPanel tone="red">Content</HudPanel>);

    expect(container.firstElementChild).toHaveClass('tone-red');
  });

  it('shows a tag only when given', () => {
    const { container, rerender } = render(<HudPanel>Content</HudPanel>);
    expect(container.querySelector('.hud-tag')).toBeNull();

    rerender(<HudPanel tag="Live feed">Content</HudPanel>);

    expect(screen.getByText('Live feed')).toBeInTheDocument();
    expect(container.querySelector('.hud-dot')).not.toBeNull();
  });

  it('is still when it appears: no entrance animation, no pulsing dot', () => {
    const { container } = render(<HudPanel tag="Status">Content</HudPanel>);

    expect(container.firstElementChild).not.toHaveClass('rise-in');
    expect(container.querySelector('.hud-dot--live')).toBeNull();
  });

  it('applies the given class names to the panel and its body', () => {
    const { container } = render(
      <HudPanel className="panel-class" bodyClassName="body-class">
        Content
      </HudPanel>,
    );

    expect(container.firstElementChild).toHaveClass('panel-class');
    expect(container.querySelector('.hud-body')).toHaveClass('body-class');
  });
});
