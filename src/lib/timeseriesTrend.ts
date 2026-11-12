import type { TimeseriesPoint } from '../types/timeseries';

const PADDING_SIDES = 2;

const MIDDLE_SHARE = 0.5;

const ROUNDING_SCALE = 100;

export type TrendSummary = {
  latest: number;
  minimum: number;
  maximum: number;
  average: number;
};

export type SparklineGeometry = {
  linePath: string;
  areaPath: string;
  lastPoint: { x: number; y: number };
  gridLines: number[];
};

export type SparklineSize = { width: number; height: number; padding: number };

export function summarizeTrend(points: TimeseriesPoint[]): TrendSummary | null {
  const last = points[points.length - 1];
  if (last === undefined) return null;

  const values = points.map((point) => point.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    latest: last.value,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    average: total / values.length,
  };
}

export function buildSparkline(
  points: TimeseriesPoint[],
  { width, height, padding }: SparklineSize,
): SparklineGeometry | null {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) return null;

  const innerWidth = width - padding * PADDING_SIDES;
  const innerHeight = height - padding * PADDING_SIDES;
  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const range = Math.max(...values) - minimum;
  const timeSpan = last.timestamp - first.timestamp;

  const coordinates = points.map((point, index) => {
    const share =
      timeSpan > 0
        ? (point.timestamp - first.timestamp) / timeSpan
        : points.length > 1
          ? index / (points.length - 1)
          : MIDDLE_SHARE;
    const level = range > 0 ? (point.value - minimum) / range : MIDDLE_SHARE;

    return {
      x: round(padding + share * innerWidth),
      y: round(padding + (1 - level) * innerHeight),
    };
  });
  const [start] = coordinates;
  const end = coordinates[coordinates.length - 1];
  if (start === undefined || end === undefined) return null;

  const linePath = coordinates
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`)
    .join(' ');
  const floor = round(height - padding);

  return {
    linePath,
    areaPath: `${linePath} L${end.x} ${floor} L${start.x} ${floor} Z`,
    lastPoint: end,
    gridLines: [0, MIDDLE_SHARE, 1].map((share) => round(padding + share * innerHeight)),
  };
}

export function formatTrendValue(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function round(value: number): number {
  return Math.round(value * ROUNDING_SCALE) / ROUNDING_SCALE;
}
