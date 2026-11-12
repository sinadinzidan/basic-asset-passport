import { READING_KIND_LABELS } from '../../constants/timeSeriesChart';
import { ReadingKind } from '../../enums/timeSeriesChart';
import type { MarkerReading } from '../../types/timeSeriesChart';
import type { ChartBucket } from '../monitoring/chartModel';
import { formatSignalWithUnit } from '../monitoring/signalFormat';

import { formatPlotTimestamp } from './plotFormat';
import { bucketAt } from './plotSeries';
import type { PlotSeries } from './plotSeries';
import { readingAt } from './readings';

export interface ReadoutRow {
  seriesId: string;
  label: string;
  color: string;
  value: string;
  detail?: string;
  kind?: ReadingKind;
  isMissing: boolean;
}

export const NO_DATA_TEXT = 'No data';

export interface HoverReading {
  entry: PlotSeries;
  bucket: ChartBucket | undefined;
}

export interface MarkerSeriesReading {
  entry: PlotSeries;
  reading: MarkerReading;
}

export function readHover(series: readonly PlotSeries[], atMs: number): HoverReading[] {
  return series.map((entry) => ({ entry, bucket: bucketAt(entry, atMs) }));
}

export function describeHover({ entry, bucket }: HoverReading): ReadoutRow {
  const hasValue = bucket !== undefined && bucket.average !== null;
  return {
    seriesId: entry.id,
    label: entry.label,
    color: entry.color,
    value: hasValue ? formatSignalWithUnit(bucket?.average, entry.unit) : NO_DATA_TEXT,
    isMissing: !hasValue,
  };
}

export function readMarker(
  series: readonly PlotSeries[],
  atMs: number,
  isInterpolated: boolean,
): MarkerSeriesReading[] {
  return series.map((entry) => ({
    entry,
    reading: readingAt(entry.id, entry.points, atMs, { isInterpolated }),
  }));
}

export function describeMarkerReading({ entry, reading }: MarkerSeriesReading): ReadoutRow {
  const isMissing = reading.kind === ReadingKind.MISSING || reading.value === null;
  const nearestAt =
    reading.kind === ReadingKind.NEAREST && reading.readingAt !== undefined
      ? ` at ${formatPlotTimestamp(reading.readingAt)}`
      : '';
  return {
    seriesId: entry.id,
    label: entry.label,
    color: entry.color,
    value: isMissing
      ? READING_KIND_LABELS[ReadingKind.MISSING]
      : formatSignalWithUnit(reading.value, entry.unit),
    detail: isMissing ? undefined : `${READING_KIND_LABELS[reading.kind]}${nearestAt}`,
    kind: reading.kind,
    isMissing,
  };
}
