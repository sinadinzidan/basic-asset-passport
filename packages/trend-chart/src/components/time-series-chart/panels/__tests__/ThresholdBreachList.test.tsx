import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';

import type { ThresholdBreach } from '../../../../types/timeSeriesChart';
import { ThresholdBreachList } from '../ThresholdBreachList';

const HOUR_MS = 3_600_000;

it('shows only the summary when no reading went beyond the limit', () => {
  render(<ThresholdBreachList summary="Within the limit" breaches={[]} unit="bar" />);

  expect(screen.getByText('Within the limit')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('offers the periods behind an Aura button that starts closed', () => {
  render(
    <ThresholdBreachList summary="Beyond the limit twice" breaches={makeBreaches(2)} unit="bar" />,
  );

  const toggle = screen.getByRole('button', { name: '2 periods' });
  expect(toggle).toHaveAttribute('data-slot', 'button');
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('list', { name: 'Periods beyond the limit' })).not.toBeInTheDocument();
});

it('lists the periods when the button is pressed and hides them when it is pressed again', async () => {
  render(
    <ThresholdBreachList summary="Beyond the limit twice" breaches={makeBreaches(2)} unit="bar" />,
  );
  const toggle = screen.getByRole('button', { name: '2 periods' });

  await userEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('list', { name: 'Periods beyond the limit' })).toBeInTheDocument();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);

  await userEvent.click(toggle);

  expect(screen.queryByRole('list', { name: 'Periods beyond the limit' })).not.toBeInTheDocument();
});

it('says how many periods are left out beyond the first five', async () => {
  render(
    <ThresholdBreachList summary="Beyond the limit often" breaches={makeBreaches(7)} unit="bar" />,
  );

  await userEvent.click(screen.getByRole('button', { name: '7 periods' }));

  expect(screen.getByText('2 more')).toBeInTheDocument();
});

function makeBreaches(count: number): ThresholdBreach[] {
  return Array.from(
    { length: count },
    (_unused, index) =>
      ({
        from: index * 2 * HOUR_MS,
        to: index * 2 * HOUR_MS + HOUR_MS,
        peak: 12 + index,
      }) as Partial<ThresholdBreach> as ThresholdBreach,
  );
}
