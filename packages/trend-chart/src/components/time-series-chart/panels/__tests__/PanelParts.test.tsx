import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createDefinition, createSeriesView } from '../../../../mocks/chartData';
import { PanelFooter } from '../PanelFooter';
import { PanelSection } from '../PanelSection';
import { SeriesLabel } from '../SeriesLabel';

describe(PanelFooter.name, () => {
  it('shows what it is given', () => {
    render(
      <PanelFooter>
        <button type="button">Load more</button>
      </PanelFooter>,
    );

    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
  });
});

describe(PanelSection.name, () => {
  it('puts its content under a heading', () => {
    render(
      <PanelSection title="Plot">
        <p>Content</p>
      </PanelSection>,
    );

    expect(screen.getByRole('heading', { name: 'Plot' })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('shows the description and the action it is given', () => {
    render(
      <PanelSection
        title="Plot"
        description="How the plot is drawn"
        action={<button type="button">Reset</button>}
      >
        <p>Content</p>
      </PanelSection>,
    );

    expect(screen.getByText('How the plot is drawn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('has no description unless it is given one', () => {
    const { container } = render(
      <PanelSection title="Plot">
        <span>Content</span>
      </PanelSection>,
    );

    expect(container.querySelector('p')).not.toBeInTheDocument();
  });
});

describe(SeriesLabel.name, () => {
  it('names the series beside a dot in its colour', () => {
    const { container } = render(<SeriesLabel series={createSeriesView()} />);

    expect(screen.getByText('Discharge pressure')).toHaveClass('font-semibold');
    expect(container.querySelector('[aria-hidden]')?.getAttribute('style')).toContain(
      'var(--chart-1)',
    );
  });

  it('is small and muted when quiet', () => {
    const series = createSeriesView({ definition: createDefinition({ name: 'Flow' }) });

    render(<SeriesLabel series={series} isQuiet />);

    expect(screen.getByText('Flow')).toHaveClass('text-xs', 'text-muted-foreground');
  });
});
