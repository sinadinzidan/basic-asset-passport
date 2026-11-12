import { HALF } from '../../../constants/mathConstants';
import { EventShape } from '../../../enums/eventShape';
import type { ChartEvent } from '../../../types/timeSeriesChart';
import { SURFACE_COLOR } from '../../general/charts/chartColors';

import { eventColor, eventTitle } from './plotEvents';
import { EVENT_GLYPH_SIZE_PX } from './plotLayout';

interface EventGlyphProperties {
  event: ChartEvent;
  x: number;
  bottom: number;
}

function GlyphShape({ shape }: { shape: EventShape | undefined }) {
  switch (shape) {
    case EventShape.TRIANGLE:
      return <polygon points="9,2 16,15 2,15" />;
    case EventShape.DIAMOND:
      return <polygon points="9,1 17,9 9,17 1,9" />;
    case EventShape.SQUARE:
      return <rect x="3" y="3" width="12" height="12" />;
    case EventShape.CIRCLE:
    case undefined:
      return <circle cx="9" cy="9" r="7" />;
  }
}

/** The picture of an event on the time axis. The button that makes it selectable is separate (`EventButton`), so the exported image carries the glyph too. */
export function EventGlyph({ event, x, bottom }: EventGlyphProperties) {
  return (
    <g
      transform={`translate(${x - EVENT_GLYPH_SIZE_PX * HALF} ${bottom - EVENT_GLYPH_SIZE_PX})`}
      fill={eventColor(event)}
      stroke={SURFACE_COLOR}
      strokeWidth="1.5"
      data-testid="chart-event-glyph"
      data-kind={event.kind}
    >
      <title>{eventTitle(event)}</title>
      <GlyphShape shape={event.shape} />
    </g>
  );
}
