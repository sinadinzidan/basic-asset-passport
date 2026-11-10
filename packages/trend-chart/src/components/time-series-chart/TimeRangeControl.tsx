import { DateTimeRangePicker } from '@cognite/aura/components/date-time-pickers';
import type { ShortcutItem } from '@cognite/aura/components/date-time-pickers';
import { toast } from '@cognite/aura/components/sonner-toast';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useMemo } from 'react';

import { CHART_RANGE_PRESETS } from '../../constants/timeSeriesChart';
import type { ChartRange } from '../../enums/monitoring';
import { useActiveShortcutMark } from '../../hooks/time-series-chart/useActiveShortcutMark';
import { activeRangePresetId } from '../../lib/time-series-chart/rangePresets';
import { chartTimeZone, fromZonedInput, toZonedInput } from '../../lib/timeZone';
import type { ChartTimeRange } from '../../types/timeSeriesChart';

const PICKER_FORMAT = 'DD MMM YYYY HH:mm';
const ZONED_INPUT_FORMAT = 'YYYY-MM-DDTHH:mm';
const MILLISECONDS_PER_MINUTE = 60_000;
/** The picker works to the minute, so a window that ends within a minute of now ends at now, and a span within a minute of a preset is that preset. */
const MATCH_TOLERANCE_MS = MILLISECONDS_PER_MINUTE;
const TODAY_SHORTCUT_ID = 'today';

type PickerRange = [Dayjs | null, Dayjs | null];

interface TimeRangeControlProps {
  window: ChartTimeRange;
  nowMs: number;
  onRangeChange: (range: ChartRange) => void;
  onWindowChange: (window: ChartTimeRange) => void;
}

/** The picker works in the browser's local clock, so an instant is shown by putting its wall-clock fields in the chart's zone into a local date. */
function toPickerDate(ms: number): Dayjs {
  return dayjs(toZonedInput(ms));
}

function fromPickerDate(date: Dayjs | null): number | undefined {
  return date ? fromZonedInput(date.format(ZONED_INPUT_FORMAT)) : undefined;
}

/** A shortcut that follows now keeps following it; anything else is a window that stays put. The end cannot be after now and must come after the start. */
export function TimeRangeControl({ window: chartWindow, nowMs, onRangeChange, onWindowChange }: TimeRangeControlProps) {
  const value = useMemo<PickerRange>(
    () => [toPickerDate(chartWindow.start), toPickerDate(chartWindow.end)],
    [chartWindow.start, chartWindow.end],
  );
  const activePresetId = activeRangePresetId(chartWindow, nowMs);
  // The picker cannot show which shortcut is active, so it is marked for the stylesheet to highlight.
  useActiveShortcutMark(CHART_RANGE_PRESETS.find((preset) => preset.id === activePresetId)?.label);
  const shortcuts = useMemo<ShortcutItem[]>(() => {
    const now = toPickerDate(nowMs);
    return [
      { id: TODAY_SHORTCUT_ID, label: 'Today', getValue: () => [now.startOf('day'), now] },
      ...CHART_RANGE_PRESETS.map((preset) => ({
        id: preset.id,
        label: preset.label,
        getValue: (): PickerRange => [toPickerDate(nowMs - preset.minutes * MILLISECONDS_PER_MINUTE), now],
      })),
    ];
  }, [nowMs]);

  const handleChange = (next: PickerRange): void => {
    const start = fromPickerDate(next[0]);
    const end = fromPickerDate(next[1]);
    if (start === undefined || end === undefined) return;
    if (end > nowMs + MATCH_TOLERANCE_MS) {
      toast.error('The end cannot be after now.');
      return;
    }
    if (start >= end) {
      toast.error('The start must precede the end.');
      return;
    }
    const endsNow = Math.abs(end - nowMs) <= MATCH_TOLERANCE_MS;
    const preset = endsNow
      ? CHART_RANGE_PRESETS.find(
          (candidate) =>
            candidate.range !== undefined &&
            Math.abs(end - start - candidate.minutes * MILLISECONDS_PER_MINUTE) <= MATCH_TOLERANCE_MS,
        )
      : undefined;
    if (preset?.range) onRangeChange(preset.range);
    else onWindowChange({ start, end: Math.min(end, nowMs) });
  };

  // The picker shows its own copy of the dates, refreshed only when it opens, so a window changed from outside (a shortcut, a drag on the plot) would keep the old text; a new minute-wide key makes it start again from the window.
  const pickerKey = `${Math.floor(chartWindow.start / MILLISECONDS_PER_MINUTE)}-${Math.floor(chartWindow.end / MILLISECONDS_PER_MINUTE)}`;
  return (
    <div
      role="group"
      aria-label={`Time range (${chartTimeZone().label})`}
      data-chart-time-range
      className="w-[26rem] max-w-full"
    >
      <DateTimeRangePicker
        key={pickerKey}
        value={value}
        onChange={handleChange}
        format={PICKER_FORMAT}
        timeFormat="24h"
        shortcuts={shortcuts}
        defaultDate={toPickerDate(nowMs)}
      />
    </div>
  );
}
