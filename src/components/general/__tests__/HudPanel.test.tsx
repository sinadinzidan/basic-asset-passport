import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HudShape } from '../../../enums/hudShape';
import { HudTone } from '../../../enums/hudTone';
import { HudPanel } from '../HudPanel';

describe(HudPanel.name, () => {
  it('shows its content', () => {
    render(<HudPanel>Panel content</HudPanel>);

    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('uses the cyan tone unless another is given', () => {
    const { container, rerender } = render(<HudPanel>Content</HudPanel>);

    expect(container.firstElementChild).toHaveClass('tone-cyan');

    rerender(<HudPanel tone={HudTone.RED}>Content</HudPanel>);

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

  it('has the plain cut-corner outline and no vent unless another shape is given', () => {
    const { container } = render(<HudPanel>Content</HudPanel>);

    expect(container.firstElementChild).not.toHaveClass('hud-notched');
    expect(container.firstElementChild).not.toHaveClass('hud-screen');
    expect(container.querySelector('.hud-vent')).toBeNull();
  });

  it('takes the notched outline when notched', () => {
    const { container } = render(<HudPanel shape={HudShape.NOTCHED}>Content</HudPanel>);

    expect(container.firstElementChild).toHaveClass('hud-notched');
    expect(container.firstElementChild).not.toHaveClass('hud-screen');
  });

  it('takes the screen outline, without a vent, when it is a screen', () => {
    const { container } = render(<HudPanel shape={HudShape.SCREEN}>Content</HudPanel>);

    expect(container.firstElementChild).toHaveClass('hud-screen');
    expect(container.firstElementChild).not.toHaveClass('hud-notched');
    expect(container.querySelector('.hud-vent')).toBeNull();
  });

  it('draws the vent of a notched panel outside its clipped body, hidden from assistive technology', () => {
    const { container } = render(<HudPanel shape={HudShape.NOTCHED}>Content</HudPanel>);

    const vent = container.querySelector('.hud-vent');

    expect(vent).toHaveAttribute('aria-hidden', 'true');
    expect(vent?.parentElement).toBe(container.firstElementChild);
    expect(container.querySelector('.hud-body')).not.toContainElement(
      container.querySelector<HTMLElement>('.hud-vent'),
    );
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
