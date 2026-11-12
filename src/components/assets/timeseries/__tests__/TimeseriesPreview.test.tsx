import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TimeseriesPreviewKind } from '../../../../enums/timeseriesPreviewKind';
import { TimeseriesPreview } from '../TimeseriesPreview';

const points = [
  { timestamp: 1000, value: 2 },
  { timestamp: 2000, value: 10 },
  { timestamp: 3000, value: 6 },
];

describe(TimeseriesPreview.name, () => {
  it('describes the chart for assistive technology', () => {
    render(
      <TimeseriesPreview preview={{ kind: TimeseriesPreviewKind.READY, points }} unit="bar" />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Last 6 months: latest 6 bar, from 2 to 10 bar',
      }),
    ).toBeInTheDocument();
  });

  it('shows the latest, lowest, highest and average reading with the unit', () => {
    render(
      <TimeseriesPreview preview={{ kind: TimeseriesPreviewKind.READY, points }} unit="bar" />,
    );

    expect(screen.getByText('Latest').nextSibling).toHaveTextContent('6bar');
    expect(screen.getByText('Min').nextSibling).toHaveTextContent('2bar');
    expect(screen.getByText('Max').nextSibling).toHaveTextContent('10bar');
    expect(screen.getByText('Avg').nextSibling).toHaveTextContent('6bar');
  });

  it('shows readings without a unit when the series has none', () => {
    render(
      <TimeseriesPreview preview={{ kind: TimeseriesPreviewKind.READY, points }} unit={null} />,
    );

    expect(screen.getByText('Latest').nextSibling).toHaveTextContent(/^6$/);
  });

  it('draws the line and the newest point', () => {
    const { container } = render(
      <TimeseriesPreview preview={{ kind: TimeseriesPreviewKind.READY, points }} unit={null} />,
    );

    expect(container.querySelector('.trend-chart__line')).toHaveAttribute(
      'd',
      expect.stringMatching(/^M/),
    );
    expect(container.querySelector('.trend-chart__dot')).not.toBeNull();
  });

  it('shows a busy placeholder while the readings load', () => {
    render(<TimeseriesPreview preview={{ kind: TimeseriesPreviewKind.LOADING }} unit={null} />);

    expect(screen.getByLabelText('Loading preview')).toHaveAttribute('aria-busy', 'true');
  });

  it.each([
    [TimeseriesPreviewKind.NON_NUMERIC, 'Not a numeric series: there is no trend to draw.'],
    [TimeseriesPreviewKind.EMPTY, 'No readings in the last 6 months.'],
    [TimeseriesPreviewKind.UNAVAILABLE, 'The preview could not be loaded.'],
  ] as const)('explains a %s preview', (kind, message) => {
    render(<TimeseriesPreview preview={{ kind }} unit={null} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
