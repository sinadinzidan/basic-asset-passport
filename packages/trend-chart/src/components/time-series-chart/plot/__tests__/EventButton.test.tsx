import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import type { ChartEvent } from '../../../../types/timeSeriesChart';
import { EventButton } from '../EventButton';
import { EVENT_GLYPH_SIZE_PX } from '../plotLayout';

const event: ChartEvent = { id: 'event-1', kind: 'ALARM', kindLabel: 'Alarm', at: 0, label: 'A-1' };

it('is an Aura button named after the event and what pressing it does', () => {
  render(<EventButton event={event} x={100} bottom={200} onSelect={vi.fn()} />);

  const marker = screen.getByRole('button', { name: 'Alarm A-1. Open the event' });
  expect(marker).toHaveAttribute('data-slot', 'button');
  expect(marker).toHaveAttribute('title', 'Alarm A-1');
});

it('is named after the event alone when nothing opens', () => {
  render(<EventButton event={event} x={100} bottom={200} />);

  expect(screen.getByRole('button', { name: 'Alarm A-1' })).toBeInTheDocument();
});

it('sits over its glyph, centred on the instant and resting on the axis', () => {
  render(<EventButton event={event} x={100} bottom={200} onSelect={vi.fn()} />);

  expect(screen.getByTestId('chart-event')).toHaveStyle({
    left: `${100 - EVENT_GLYPH_SIZE_PX / 2}px`,
    top: `${200 - EVENT_GLYPH_SIZE_PX}px`,
    width: `${EVENT_GLYPH_SIZE_PX}px`,
    height: `${EVENT_GLYPH_SIZE_PX}px`,
  });
});

it('reports the event when it is pressed', async () => {
  const onSelect = vi.fn();
  render(<EventButton event={event} x={100} bottom={200} onSelect={onSelect} />);

  await userEvent.click(screen.getByRole('button'));

  expect(onSelect).toHaveBeenCalledWith(event);
});
