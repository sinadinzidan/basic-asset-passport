import { MILLISECONDS_PER_DAY } from '../../constants/formats';
import {
  DECIMAL_BASE,
  HALF,
  PERCENT_FULL,
  PERCENT_HALF,
  TICK_FRACTION_DIGITS,
} from '../../constants/mathConstants';
import {
  CHART_ALL_HISTORY_DAYS,
  CHART_RANGE_MINUTES,
  CHART_TIME_TICK_COUNT,
  MILLISECONDS_PER_MINUTE,
} from '../../constants/monitoring';
import { ChartRange } from '../../enums/monitoring';
import type { TimeSeriesPoint } from '../../types/timeSeriesChart';
import { zonedFormat } from '../timeZone';

const SECONDS_TICK_MAX_SPAN_MINUTES = 10;
const NICE_STEP_TWO = 2;
const NICE_STEP_TWO_AND_HALF = 2.5;
const NICE_STEP_FIVE = 5;
const DEFAULT_TICK_TARGET = 5;
const FLAT_SERIES_PADDING_RATIO = 0.1;
const DAY_AND_TIME_MAX_SPAN_DAYS = 3;
const DAY_AND_MONTH_MAX_SPAN_DAYS = 95;
const MONTH_AND_YEAR_MAX_SPAN_DAYS = 400;

export interface ChartWindow {
  fromMs: number;
  toMs: number;
}

export interface ChartBucket {
  atMs: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  goodCount: number;
  flaggedCount: number;
}

export interface GapSpan {
  fromMs: number;
  toMs: number;
}

export function resolveChartWindow(
  range: ChartRange,
  nowMs: number,
  custom?: ChartWindow,
): ChartWindow {
  if (range === ChartRange.CUSTOM) {
    if (custom && custom.toMs > custom.fromMs) return custom;
    return resolveChartWindow(ChartRange.ONE_WEEK, nowMs);
  }
  if (range === ChartRange.ALL_HISTORY)
    return { fromMs: nowMs - CHART_ALL_HISTORY_DAYS * MILLISECONDS_PER_DAY, toMs: nowMs };
  return { fromMs: nowMs - CHART_RANGE_MINUTES[range] * MILLISECONDS_PER_MINUTE, toMs: nowMs };
}

/**
 * At most `maxBuckets` equal buckets over the window; the average is the line and the min and max the band.
 * Flagged samples are left out of every aggregate (CE-09). With fewer samples than buckets there is one bucket per sample.
 */
export function aggregateReadings(
  points: readonly TimeSeriesPoint[],
  window: ChartWindow,
  maxBuckets: number,
): ChartBucket[] {
  const isGoodReading = (point: TimeSeriesPoint): point is TimeSeriesPoint & { value: number } =>
    point.value !== null && Number.isFinite(point.value) && point.isBadQuality !== true;
  const inWindow = points.filter(
    (point) => point.timestamp >= window.fromMs && point.timestamp <= window.toMs,
  );
  if (inWindow.length <= maxBuckets) {
    return inWindow.map((point) => {
      const isGood = isGoodReading(point);
      return {
        atMs: point.timestamp,
        average: isGood ? point.value : null,
        minimum: isGood ? point.value : null,
        maximum: isGood ? point.value : null,
        goodCount: isGood ? 1 : 0,
        flaggedCount: point.isBadQuality === true ? 1 : 0,
      };
    });
  }
  const width = (window.toMs - window.fromMs) / maxBuckets;
  const sums = Array.from({ length: maxBuckets }, () => ({
    sum: 0,
    good: 0,
    flagged: 0,
    minimum: Number.POSITIVE_INFINITY,
    maximum: Number.NEGATIVE_INFINITY,
  }));
  for (const point of inWindow) {
    const index = Math.min(maxBuckets - 1, Math.floor((point.timestamp - window.fromMs) / width));
    const bucket = sums[index];
    if (!bucket) continue;
    if (point.isBadQuality === true) bucket.flagged += 1;
    if (!isGoodReading(point)) continue;
    bucket.sum += point.value;
    bucket.good += 1;
    bucket.minimum = Math.min(bucket.minimum, point.value);
    bucket.maximum = Math.max(bucket.maximum, point.value);
  }
  return sums.map((bucket, index) => ({
    atMs: window.fromMs + width * (index + HALF),
    average: bucket.good > 0 ? bucket.sum / bucket.good : null,
    minimum: bucket.good > 0 ? bucket.minimum : null,
    maximum: bucket.good > 0 ? bucket.maximum : null,
    goodCount: bucket.good,
    flaggedCount: bucket.flagged,
  }));
}

/** Runs of consecutive buckets that have a value: the line is drawn per run so a gap is never joined up or drawn as zero. */
export function splitIntoRuns(buckets: readonly ChartBucket[]): ChartBucket[][] {
  const runs: ChartBucket[][] = [];
  let current: ChartBucket[] = [];
  for (const bucket of buckets) {
    if (bucket.average === null) {
      if (current.length > 0) runs.push(current);
      current = [];
    } else {
      current.push(bucket);
    }
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

export function findGapSpans(buckets: readonly ChartBucket[], window: ChartWindow): GapSpan[] {
  const spans: GapSpan[] = [];
  let spanStart: number | undefined;
  let lastGoodMs = window.fromMs;
  for (const bucket of buckets) {
    if (bucket.average === null) {
      spanStart = spanStart ?? lastGoodMs;
    } else {
      if (spanStart !== undefined) spans.push({ fromMs: spanStart, toMs: bucket.atMs });
      spanStart = undefined;
      lastGoodMs = bucket.atMs;
    }
  }
  if (spanStart !== undefined) spans.push({ fromMs: spanStart, toMs: window.toMs });
  if (buckets.length === 0) return [{ fromMs: window.fromMs, toMs: window.toMs }];
  return spans;
}

/** The bucket nearest to an instant, if it is within a bucket and a half; otherwise the signal has no value there. */
export function nearestBucket(
  buckets: readonly ChartBucket[],
  atMs: number,
  toleranceMs: number,
): ChartBucket | undefined {
  let best: ChartBucket | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const bucket of buckets) {
    const distance = Math.abs(bucket.atMs - atMs);
    if (distance < bestDistance) {
      best = bucket;
      bestDistance = distance;
    }
  }
  return best && bestDistance <= toleranceMs && best.average !== null ? best : undefined;
}

export interface NiceScale {
  minimum: number;
  maximum: number;
  ticks: number[];
}

/** Up to this span the tick labels carry seconds, so the ticks of a one-minute window do not all read alike. */
const SECONDS_TICK_MAX_SPAN_MS = SECONDS_TICK_MAX_SPAN_MINUTES * MILLISECONDS_PER_MINUTE;
const NICE_STEPS = [1, NICE_STEP_TWO, NICE_STEP_TWO_AND_HALF, NICE_STEP_FIVE, DECIMAL_BASE];

export function niceScale(
  minimum: number,
  maximum: number,
  tickTarget = DEFAULT_TICK_TARGET,
): NiceScale {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum))
    return { minimum: 0, maximum: 1, ticks: [0, 1] };
  const padded =
    maximum === minimum
      ? {
          low: minimum - Math.max(Math.abs(minimum) * FLAT_SERIES_PADDING_RATIO, 1),
          high: maximum + Math.max(Math.abs(maximum) * FLAT_SERIES_PADDING_RATIO, 1),
        }
      : { low: minimum, high: maximum };
  const rawStep = (padded.high - padded.low) / Math.max(1, tickTarget);
  const magnitude = DECIMAL_BASE ** Math.floor(Math.log10(rawStep));
  const step =
    (NICE_STEPS.find((candidate) => candidate * magnitude >= rawStep) ?? DECIMAL_BASE) * magnitude;
  const low = Math.floor(padded.low / step) * step;
  const high = Math.ceil(padded.high / step) * step;
  const ticks: number[] = [];
  for (let value = low; value <= high + step * HALF; value += step)
    ticks.push(Number(value.toFixed(TICK_FRACTION_DIGITS)));
  return {
    minimum: Number(low.toFixed(TICK_FRACTION_DIGITS)),
    maximum: Number(high.toFixed(TICK_FRACTION_DIGITS)),
    ticks,
  };
}

export function buildTimeTicks(window: ChartWindow, count = CHART_TIME_TICK_COUNT): number[] {
  const step = (window.toMs - window.fromMs) / (count - 1);
  return Array.from({ length: count }, (_unused, index) => window.fromMs + step * index);
}

const timeOnly = () => zonedFormat({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const timeWithSeconds = () =>
  zonedFormat({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
const dayAndMonth = () => zonedFormat({ day: '2-digit', month: 'short' });
const monthAndShortYear = () => zonedFormat({ month: 'short', year: '2-digit' });
const monthAndYear = () => zonedFormat({ month: 'short', year: 'numeric' });

export function formatChartTick(ms: number, spanMs: number): string {
  const date = new Date(ms);
  if (spanMs <= SECONDS_TICK_MAX_SPAN_MS) return timeWithSeconds().format(date);
  if (spanMs <= MILLISECONDS_PER_DAY) return timeOnly().format(date);
  if (spanMs <= DAY_AND_TIME_MAX_SPAN_DAYS * MILLISECONDS_PER_DAY)
    return `${dayAndMonth().format(date)} ${timeOnly().format(date)}`;
  if (spanMs <= DAY_AND_MONTH_MAX_SPAN_DAYS * MILLISECONDS_PER_DAY)
    return dayAndMonth().format(date);
  if (spanMs <= MONTH_AND_YEAR_MAX_SPAN_DAYS * MILLISECONDS_PER_DAY)
    return monthAndShortYear().format(date);
  return monthAndYear().format(date);
}

export interface AxisGroup {
  unit: string;
  seriesIds: string[];
}

export function groupAxesByUnit(series: ReadonlyArray<{ id: string; unit: string }>): {
  groups: AxisGroup[];
} {
  const groups: AxisGroup[] = [];
  for (const entry of series) {
    const group = groups.find((candidate) => candidate.unit === entry.unit);
    if (group) group.seriesIds.push(entry.id);
    else groups.push({ unit: entry.unit, seriesIds: [entry.id] });
  }
  return { groups };
}

export function normaliseValue(value: number, minimum: number, maximum: number): number {
  if (maximum === minimum) return PERCENT_HALF;
  return ((value - minimum) / (maximum - minimum)) * PERCENT_FULL;
}

export function observedExtent(
  buckets: readonly ChartBucket[],
): { minimum: number; maximum: number } | undefined {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;
  for (const bucket of buckets) {
    if (bucket.minimum === null || bucket.maximum === null) continue;
    minimum = Math.min(minimum, bucket.minimum);
    maximum = Math.max(maximum, bucket.maximum);
  }
  return Number.isFinite(minimum) && Number.isFinite(maximum) ? { minimum, maximum } : undefined;
}
