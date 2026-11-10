import type { ChartEvent } from '../../../types/timeSeriesChart';

import { eventTitle } from './plotEvents';
import { EVENT_GLYPH_SIZE_PX } from './plotLayout';

interface EventButtonProps {
  event: ChartEvent;
  x: number;
  bottom: number;
  onSelect?: (event: ChartEvent) => void;
}

export function EventButton({ event, x, bottom, onSelect }: EventButtonProps) {
  const title = eventTitle(event);
  return (
    <button
      type="button"
      className="absolute z-10 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      style={{
        left: x - EVENT_GLYPH_SIZE_PX / 2,
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
