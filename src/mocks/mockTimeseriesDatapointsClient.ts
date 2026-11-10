
import { CHART_MAX_POINTS } from '../constants/timeseries';
import { granularityToMs } from '../lib/timeseriesGranularity';
import type {
  TimeseriesDatapointsClient,
  TimeseriesIdentifier,
  TimeseriesPoint,
  TimeseriesTrendWindow,
} from '../types/timeseries';

import { MOCK_LATENCY_MS, MOCK_PROJECT } from './mockAssetDataClient';

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_STEP_MS = 6 * 60 * 60 * 1000;

type SeriesShape = { base: number; swing: number; drift: number; periodDays: number };

/** Hand-picked shapes so each dummy series has its own character; others get a gentle wave. */
const SHAPES: Record<string, SeriesShape> = {
  'PI.G307.PT-101': { base: 7.4, swing: 0.9, drift: 0.4, periodDays: 2.2 },
  'PI.G307.TT-102': { base: 68, swing: 6, drift: 5, periodDays: 3.4 },
  'PI.G412.VT-201': { base: 3.1, swing: 1.1, drift: -0.6, periodDays: 1.6 },
};
const FALLBACK_SHAPE: SeriesShape = { base: 50, swing: 5, drift: 0, periodDays: 2.5 };

/**
 * Answers trend requests with smooth, deterministic dummy readings: one
 * average per step of the requested granularity, each a function of its own
 * timestamp, so any window of a series agrees with every other and the preview
 * and the chart show the same line.
 */
export function makeMockTimeseriesDatapointsClient(
  latencyMs: number = MOCK_LATENCY_MS,
): TimeseriesDatapointsClient {
  return {
    project: MOCK_PROJECT,
    isSimulated: true,
    getTrends: (identifiers, window) =>
      new Promise((resolve) => {
        setTimeout(
          () =>
            resolve(
              identifiers.map((identifier) => ({
                space: identifier.space,
                externalId: identifier.externalId,
                points: makePoints(identifier, window),
              })),
            ),
          latencyMs,
        );
      }),
  };
}

function makePoints(
  { externalId }: TimeseriesIdentifier,
  { from, to, granularity, limit }: TimeseriesTrendWindow,
): TimeseriesPoint[] {
  const shape = SHAPES[externalId] ?? FALLBACK_SHAPE;
  const stepMs = granularityToMs(granularity) ?? FALLBACK_STEP_MS;
  const maxPoints = Math.min(limit ?? CHART_MAX_POINTS, CHART_MAX_POINTS * 2);
  const points: TimeseriesPoint[] = [];

  // Averages sit on step boundaries, as the API's do.
  for (
    let timestamp = Math.ceil(from / stepMs) * stepMs;
    timestamp <= to && points.length < maxPoints;
    timestamp += stepMs
  ) {
    points.push({ timestamp, value: readingAt(shape, timestamp) });
  }

  return points;
}

function readingAt(
  { base, swing, drift, periodDays }: SeriesShape,
  timestamp: number,
): number {
  const days = timestamp / DAY_MS;
  const wave = Math.sin((days / periodDays) * 2 * Math.PI) * swing;
  const ripple = Math.sin(days * 37) * swing * 0.12;
  // A slow drift that repeats every ten days, so it never leaves the same range.
  const trend = Math.sin((days / 10) * 2 * Math.PI) * drift;

  return Number((base + wave + ripple + trend).toFixed(2));
}
