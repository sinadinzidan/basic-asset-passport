import { CHART_MAX_BUCKETS } from '../../constants/monitoring';
import {
  CHART_GAP_STEP_FACTOR,
  CHART_NEAREST_STEP_FACTOR,
  LINE_STYLE_DASH_ARRAYS,
} from '../../constants/timeSeriesChart';
import { ThresholdLevel, ThresholdSide } from '../../enums/timeSeriesChart';
import type {
  ChartThreshold,
  ChartSeriesView,
  ChartTimeRange,
  ThresholdBreach,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';
import { aggregateReadings, nearestBucket } from '../monitoring/chartModel';
import type { ChartBucket } from '../monitoring/chartModel';
import { yPosition } from '../monitoring/plotModel';
import type { LimitValues, PlotModel } from '../monitoring/plotModel';

import { findExtremes, pointsInRange, typicalStepMs } from './statistics';
import { findBreaches } from './thresholds';

export type ExtremeReading = TimeSeriesPoint & { value: number };

export interface PlotSeries {
  id: string;
  label: string;
  unit: string;
  color: string;
  lineWidth: number;
  dashArray: string | undefined;
  buckets: ChartBucket[];
  isAggregated: boolean;
  hasValues: boolean;
  stepMs: number;
  min?: ExtremeReading;
  max?: ExtremeReading;
  thresholds: ChartThreshold[];
  breaches: ThresholdBreach[];
  points: readonly TimeSeriesPoint[];
}

export interface PlotSeriesOptions {
  showMinMax: boolean;
  showThresholds: boolean;
}

const FALLBACK_STEP_SHARE = 100;

export function seriesLabel(view: ChartSeriesView): string {
  return view.definition.name || view.definition.tag || view.definition.id;
}

/**
 * The buckets to draw for the window. Dense data is aggregated down to the bucket limit. Sparse data keeps one bucket per
 * reading, and an empty bucket is put into every interval much longer than the typical step so the line breaks there instead
 * of joining two readings across a gap.
 */
export function plotBuckets(
  points: readonly TimeSeriesPoint[],
  window: ChartTimeRange,
): { buckets: ChartBucket[]; isAggregated: boolean } {
  const buckets = aggregateReadings(points, { fromMs: window.start, toMs: window.end }, CHART_MAX_BUCKETS);
  const isAggregated = pointsInRange(points, window).length > CHART_MAX_BUCKETS;
  if (isAggregated) return { buckets, isAggregated };
  const step = typicalStepMs(points);
  if (step === undefined) return { buckets, isAggregated };
  const broken: ChartBucket[] = [];
  buckets.forEach((bucket, index) => {
    const previous = buckets[index - 1];
    if (
      previous &&
      previous.average !== null &&
      bucket.average !== null &&
      bucket.atMs - previous.atMs > step * CHART_GAP_STEP_FACTOR
    ) {
      broken.push({
        atMs: (previous.atMs + bucket.atMs) / 2,
        average: null,
        minimum: null,
        maximum: null,
        goodCount: 0,
        flaggedCount: 0,
      });
    }
    broken.push(bucket);
  });
  return { buckets: broken, isAggregated };
}

export function buildPlotSeries(view: ChartSeriesView, window: ChartTimeRange, options: PlotSeriesOptions): PlotSeries {
  const { buckets, isAggregated } = plotBuckets(view.points, window);
  const extremes = options.showMinMax ? findExtremes(view.points, window) : {};
  const thresholds = options.showThresholds ? view.thresholds : [];
  const span = window.end - window.start;
  return {
    id: view.definition.id,
    label: seriesLabel(view),
    unit: view.unit,
    color: view.configuration.style.color,
    lineWidth: view.configuration.style.lineWidth,
    dashArray: LINE_STYLE_DASH_ARRAYS[view.configuration.style.lineStyle],
    buckets,
    isAggregated,
    hasValues: buckets.some((bucket) => bucket.average !== null),
    stepMs: isAggregated ? span / CHART_MAX_BUCKETS : (typicalStepMs(view.points) ?? span / FALLBACK_STEP_SHARE),
    min: extremes.min,
    max: extremes.max,
    thresholds,
    breaches: thresholds.some((threshold) => !threshold.isReference)
      ? findBreaches(
          view.points,
          thresholds.filter((threshold) => !threshold.isReference),
          window,
        )
      : [],
    points: view.points,
  };
}

export function limitValuesOf(thresholds: readonly ChartThreshold[]): LimitValues {
  const limits: LimitValues = {};
  for (const threshold of thresholds) {
    const isAlert = threshold.level === ThresholdLevel.ALERT;
    const isUpper = threshold.side === ThresholdSide.UPPER;
    const key: keyof LimitValues = isAlert
      ? isUpper
        ? 'alertHigh'
        : 'alertLow'
      : isUpper
        ? 'dangerHigh'
        : 'dangerLow';
    const current = limits[key];
    if (current === undefined || (isUpper ? threshold.value > current : threshold.value < current))
      limits[key] = threshold.value;
  }
  return limits;
}

export function bucketsOfBreach(series: PlotSeries, breach: ThresholdBreach, window: ChartTimeRange): ChartBucket[] {
  const tolerance = series.isAggregated ? (window.end - window.start) / CHART_MAX_BUCKETS / 2 : 0;
  return series.buckets.filter(
    (bucket) =>
      bucket.average !== null && bucket.atMs >= breach.from - tolerance && bucket.atMs <= breach.to + tolerance,
  );
}

export function bucketAt(series: PlotSeries, atMs: number): ChartBucket | undefined {
  return nearestBucket(series.buckets, atMs, series.stepMs * CHART_NEAREST_STEP_FACTOR);
}

/** The height of a value inside its lane, or undefined when it falls outside the lane, as it can with manual axis limits; such a value is not marked. */
export function laneYPosition(model: PlotModel, seriesId: string, value: number): number | undefined {
  const scale = model.scales.get(seriesId);
  const lane = scale ? model.lanes[scale.laneIndex] : undefined;
  const y = yPosition(model, seriesId, value);
  if (!lane || y === undefined || y < lane.top || y > lane.top + lane.height) return undefined;
  return y;
}
