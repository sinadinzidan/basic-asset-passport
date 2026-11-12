import { ChartRange } from '../enums/monitoring';

export const MILLISECONDS_PER_MINUTE = 60_000;

export const CHART_MAX_SIGNALS = 12;
export const CHART_MAX_BUCKETS = 800;
export const CHART_MIN_WINDOW_MINUTES = 1;
export const CHART_ALL_HISTORY_DAYS = 730;
export const CHART_TIME_TICK_COUNT = 6;
export const CHART_LANE_HEIGHT_PX = 120;
export const CHART_MIN_DRAG_PX = 8;

export const CHART_RANGE_MINUTES: Record<
  Exclude<ChartRange, ChartRange.ALL_HISTORY | ChartRange.CUSTOM>,
  number
> = {
  [ChartRange.FIFTEEN_MINUTES]: 15,
  [ChartRange.ONE_HOUR]: 60,
  [ChartRange.SIX_HOURS]: 360,
  [ChartRange.TWELVE_HOURS]: 720,
  [ChartRange.ONE_DAY]: 1440,
  [ChartRange.ONE_WEEK]: 10_080,
  [ChartRange.ONE_MONTH]: 43_200,
  [ChartRange.ONE_YEAR]: 525_600,
};

/** Eight series colours in selection order; after eight they repeat with dashed lines. */
export const SIGNAL_SERIES_COLORS: readonly string[] = [
  'var(--chart-nordic-color-1)',
  'var(--chart-fjord-color-1)',
  'var(--chart-orange-color-1)',
  'var(--chart-dusk-color-1)',
  'var(--chart-aurora-color-1)',
  'var(--chart-success-color-1)',
  'var(--chart-info-color-1)',
  'var(--chart-neutral-color-1)',
];
export const ALERT_LIMIT_COLOR = 'var(--chart-warning-color-1)';
export const DANGER_LIMIT_COLOR = 'var(--chart-destructive-color-1)';
