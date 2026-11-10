import { CHART_RANGE_PRESETS } from '../../constants/timeSeriesChart';
import type { ChartTimeRange } from '../../types/timeSeriesChart';

const MILLISECONDS_PER_MINUTE = 60_000;
/** The picker works to the minute, so a window within a minute of a preset is that preset. */
const MATCH_TOLERANCE_MS = MILLISECONDS_PER_MINUTE;

/** The id of the preset a window stands for: it ends now and spans the preset's length. Undefined for any other window. */
export function activeRangePresetId(window: ChartTimeRange, nowMs: number): string | undefined {
  if (Math.abs(window.end - nowMs) > MATCH_TOLERANCE_MS) return undefined;

  const spanMs = window.end - window.start;
  return CHART_RANGE_PRESETS.find(
    (preset) => Math.abs(spanMs - preset.minutes * MILLISECONDS_PER_MINUTE) <= MATCH_TOLERANCE_MS,
  )?.id;
}
