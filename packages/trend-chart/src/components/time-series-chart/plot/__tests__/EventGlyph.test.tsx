import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EventShape } from '../../../../enums/eventShape';
import { EventTone } from '../../../../enums/eventTone';
import type { ChartEvent } from '../../../../types/timeSeriesChart';
import { EventGlyph } from '../EventGlyph';
import { EVENT_GLYPH_SIZE_PX, EVENT_OTHER_COLOR } from '../plotLayout';

/** Each shape, the element it is drawn with and, for a polygon, its corners. */
const SHAPES: ReadonlyArray<[EventShape, string, string | undefined]> = [
  [EventShape.CIRCLE, 'circle', undefined],
  [EventShape.SQUARE, 'rect', undefined],
  [EventShape.TRIANGLE, 'polygon', '9,2 16,15 2,15'],
  [EventShape.DIAMOND, 'polygon', '9,1 17,9 9,17 1,9'],
];

describe(EventGlyph.name, () => {
  it('stands on the time axis, centred on the instant of the event', () => {
    renderGlyph({}, { x: 100, bottom: 300 });

    expect(screen.getByTestId('chart-event-glyph')).toHaveAttribute(
      'transform',
      `translate(${100 - EVENT_GLYPH_SIZE_PX / 2} ${300 - EVENT_GLYPH_SIZE_PX})`,
    );
  });

  it('is titled by the kind and the label of the event', () => {
    renderGlyph({ kind: 'ALARM', kindLabel: 'Alarm', label: 'High pressure' });

    expect(screen.getByTestId('chart-event-glyph').querySelector('title')).toHaveTextContent(
      'Alarm High pressure',
    );
  });

  it('carries the kind of the event', () => {
    renderGlyph({ kind: 'INSPECTION' });

    expect(screen.getByTestId('chart-event-glyph')).toHaveAttribute('data-kind', 'INSPECTION');
  });

  it('takes the colour of the tone of the event', () => {
    renderGlyph({ tone: EventTone.BAD });

    expect(screen.getByTestId('chart-event-glyph')).toHaveAttribute(
      'fill',
      'var(--chart-destructive-color-1)',
    );
  });

  it('takes the colour of other events when the event has no tone', () => {
    renderGlyph({ tone: undefined });

    expect(screen.getByTestId('chart-event-glyph')).toHaveAttribute('fill', EVENT_OTHER_COLOR);
  });

  it('is a circle unless the host chose a shape', () => {
    renderGlyph({ shape: undefined });

    expect(shapeOf()).toBe('circle');
  });

  it.each(SHAPES)('draws a %s', (shape, element, points) => {
    renderGlyph({ shape });

    expect(shapeOf()).toBe(element);
    expect(
      screen.getByTestId('chart-event-glyph').lastElementChild?.getAttribute('points') ?? undefined,
    ).toBe(points);
  });
});

function renderGlyph(
  overrides: Partial<ChartEvent> = {},
  place: { x: number; bottom: number } = { x: 0, bottom: 0 },
) {
  const event: ChartEvent = {
    id: 'e1',
    kind: 'ALARM',
    at: 0,
    label: 'High pressure',
    ...overrides,
  };
  return render(
    <svg>
      <EventGlyph event={event} x={place.x} bottom={place.bottom} />
    </svg>,
  );
}

/** The element the glyph is drawn with: what follows its title. */
function shapeOf(): string | undefined {
  return screen.getByTestId('chart-event-glyph').lastElementChild?.tagName.toLowerCase();
}
