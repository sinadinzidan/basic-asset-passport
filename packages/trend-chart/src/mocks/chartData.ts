import { MILLISECONDS_PER_MINUTE } from '../constants/monitoring';
import {
  LineStyle,
  SeriesDataStatus,
  ThresholdLevel,
  ThresholdSide,
  ThresholdSource,
} from '../enums/timeSeriesChart';
import { computeStatistics } from '../lib/time-series-chart/statistics';
import type {
  ChartDataAdapter,
  ChartSeriesView,
  ChartThreshold,
  TimeSeriesDefinition,
  TimeSeriesPoint,
} from '../types/timeSeriesChart';

/** Test data for the chart. Nothing here is used by the chart itself. */
export function createPoint(
  timestamp: number,
  value: number | null,
  isBadQuality?: boolean,
): TimeSeriesPoint {
  return isBadQuality === undefined ? { timestamp, value } : { timestamp, value, isBadQuality };
}

/** One reading per step from `startMs`, a minute apart unless told otherwise; null is a missing reading. */
export function createPoints(
  values: readonly (number | null)[],
  startMs = 0,
  stepMs: number = MILLISECONDS_PER_MINUTE,
): TimeSeriesPoint[] {
  return values.map((value, index) => createPoint(startMs + index * stepMs, value));
}

export function createDefinition(
  overrides: Partial<TimeSeriesDefinition> = {},
): TimeSeriesDefinition {
  return {
    id: 's1',
    name: 'Discharge pressure',
    tag: 'PT-101',
    description: 'Pump discharge pressure',
    unit: 'bar',
    sourceName: 'Demo',
    isSimulated: false,
    ...overrides,
  };
}

export function createThreshold(overrides: Partial<ChartThreshold> = {}): ChartThreshold {
  const seriesId = overrides.seriesId ?? 's1';
  const level = overrides.level ?? ThresholdLevel.ALERT;
  const side = overrides.side ?? ThresholdSide.UPPER;
  return {
    id: `${seriesId}:${level}:${side}`,
    seriesId,
    level,
    side,
    value: 8,
    unit: 'bar',
    source: ThresholdSource.DATA_SOURCE,
    ...overrides,
  };
}

export function createSeriesView(overrides: Partial<ChartSeriesView> = {}): ChartSeriesView {
  const definition = overrides.definition ?? createDefinition();
  const points = overrides.points ?? [];
  return {
    definition,
    configuration: {
      seriesId: definition.id,
      isVisible: true,
      style: { color: 'var(--chart-1)', lineWidth: 1.5, lineStyle: LineStyle.SOLID },
    },
    index: 0,
    status: SeriesDataStatus.OK,
    unit: definition.unit ?? '',
    points,
    statistics: computeStatistics(points),
    thresholds: [],
    ...overrides,
  };
}

/** A data source that knows no series and has nothing to say about any; a test overrides what it asks about. */
export function createChartAdapter(overrides: Partial<ChartDataAdapter> = {}): ChartDataAdapter {
  return {
    searchSeries: async () => ({ series: [], total: 0 }),
    getSeriesData: async (seriesIds) => seriesIds.map((seriesId) => ({ seriesId, points: [] })),
    getSeriesDetails: async () => undefined,
    getThresholds: async () => [],
    getAlerts: async () => [],
    getConnectedFiles: async () => [],
    getEvents: async () => [],
    ...overrides,
  };
}
