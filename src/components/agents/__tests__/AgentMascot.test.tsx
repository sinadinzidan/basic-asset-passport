import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AgentMascot } from '../AgentMascot';

describe(AgentMascot.name, () => {
  it('is decorative: hidden from assistive technology', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('draws the body at rest and with its arm raised, so one pose can fade into the other', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    const bodies = Array.from(container.querySelectorAll('.agent-mascot > .agent-mascot__body'));

    expect(bodies.map((body) => body.className)).toEqual([
      'agent-mascot__layer agent-mascot__body agent-mascot__body--rest',
      'agent-mascot__layer agent-mascot__body agent-mascot__body--wave',
    ]);
  });

  it('draws the raised hand as its own layer over the body, so it can turn at the wrist', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    const layers = Array.from(container.querySelectorAll('.agent-mascot > img'));

    expect(layers.map((layer) => layer.className)[2]).toBe(
      'agent-mascot__layer agent-mascot__hand'
    );
  });

  it('draws the eyes as their own layers over the body and the hand, so they can animate', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    const layers = Array.from(container.querySelectorAll('.agent-mascot > img'));

    expect(layers.slice(3).map((layer) => layer.className)).toEqual([
      'agent-mascot__layer agent-mascot__eyes agent-mascot__eyes--idle',
      'agent-mascot__layer agent-mascot__eyes agent-mascot__eyes--think',
    ]);
  });

  it('gives each layer its own picture', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    const sources = Array.from(container.querySelectorAll('img')).map((image) =>
      image.getAttribute('src')
    );

    expect(sources).toHaveLength(5);
    expect(new Set(sources).size).toBe(5);
  });

  it('marks the idle mood, which shows the smiling eyes', () => {
    const { container } = render(<AgentMascot mood="idle" />);

    expect(container.querySelector('.agent-mascot')).toHaveAttribute('data-mood', 'idle');
  });

  it('marks the thinking mood while the agent is busy, which shows the round eyes', () => {
    const { container } = render(<AgentMascot mood="think" />);

    expect(container.querySelector('.agent-mascot')).toHaveAttribute('data-mood', 'think');
  });
});
