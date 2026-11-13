import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GRID_TRACES } from '../../../constants/gridTraces';
import { NeonStage } from '../NeonStage';

describe(NeonStage.name, () => {
  it('shows its children on the stage', () => {
    const { container } = render(<NeonStage>Stage content</NeonStage>);

    expect(screen.getByText('Stage content')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('neon-stage');
  });

  it('no longer has glowing blobs behind the page', () => {
    const { container } = render(<NeonStage>Content</NeonStage>);

    expect(container.querySelector('.neon-orb')).toBeNull();
  });

  it('runs a light along the grid lines for each trace', () => {
    const { container } = render(<NeonStage>Content</NeonStage>);

    const traces = container.querySelectorAll('.neon-trace');

    expect(traces).toHaveLength(GRID_TRACES.length);
    expect(container.querySelectorAll('.neon-trace[data-axis="ROW"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.neon-trace[data-axis="COLUMN"]').length).toBeGreaterThan(0);
  });

  it('places each light on its grid line and between its two crossings', () => {
    const { container } = render(<NeonStage>Content</NeonStage>);

    const [trace] = GRID_TRACES;
    const element = container.querySelector('.neon-trace');

    expect(element).toHaveStyle({
      '--trace-line': String(trace?.line),
      '--trace-from': String(trace?.from),
      '--trace-to': String(trace?.to),
    });
  });

  it('hides the decorative lights from assistive technology', () => {
    const { container } = render(<NeonStage>Content</NeonStage>);

    expect(container.querySelector('.neon-traces')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has traces that stay on the grid and keep moving forward', () => {
    for (const trace of GRID_TRACES) {
      expect(trace.line).toBeGreaterThan(0);
      expect(trace.to).toBeGreaterThan(trace.from);
    }
  });
});
