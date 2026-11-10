import type { ChartEvent } from '../../../types/timeSeriesChart';
import { STATUS_COLORS } from '../../general/charts/chartColors';

import { EVENT_OTHER_COLOR } from './plotLayout';

export function eventColor(event: ChartEvent): string {
  return event.tone ? STATUS_COLORS[event.tone] : EVENT_OTHER_COLOR;
}

export function eventTitle(event: ChartEvent): string {
  return `${event.kindLabel ?? event.kind} ${event.label}`.trim();
}
