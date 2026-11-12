import { HALF } from '../../../constants/mathConstants';
import type { ChartEvent } from '../../../types/timeSeriesChart';
import { PlainButton } from '../../general/PlainButton';

import { eventTitle } from './plotEvents';
import { EVENT_GLYPH_SIZE_PX } from './plotLayout';

interface EventButtonProperties {
  event: ChartEvent;
  x: number;
  bottom: number;
  onSelect?: (event: ChartEvent) => void;
}

export function EventButton({ event, x, bottom, onSelect }: EventButtonProperties) {
  const title = eventTitle(event);
  return (
    <PlainButton
      className="absolute z-10 focus-visible:outline-offset-1"
      style={{
        left: x - EVENT_GLYPH_SIZE_PX * HALF,
        top: bottom - EVENT_GLYPH_SIZE_PX,
        width: EVENT_GLYPH_SIZE_PX,
        height: EVENT_GLYPH_SIZE_PX,
      }}
      title={title}
      aria-label={onSelect ? `${title}. Open the event` : title}
      data-testid="chart-event"
      onClick={() => onSelect?.(event)}
    />
  );
}
