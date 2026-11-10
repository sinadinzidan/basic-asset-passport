import {
  CHART_GRANULARITY_STEPS,
  CHART_MAX_POINTS,
} from '../constants/timeseries';

const MINUTE_MS = 60_000;
const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: MINUTE_MS,
  h: 60 * MINUTE_MS,
  d: 24 * 60 * MINUTE_MS,
};

/** The length of a granularity such as "15m" in milliseconds; null when it is not one. */
export function granularityToMs(granularity: string): number | null {
  const match = /^(\d+)([smhd])$/.exec(granularity);
  if (!match) return null;

  const [, count, unit] = match;
  const unitMs = UNIT_MS[unit];
  const amount = Number(count);

  return unitMs === undefined || amount <= 0 ? null : amount * unitMs;
}

/**
 * The finest averaging step that keeps a window within the chart's point
 * budget. A window longer than the coarsest step allows uses that step.
 */
export function chooseChartGranularity(rangeMs: number): string {
  const coarsest = CHART_GRANULARITY_STEPS[CHART_GRANULARITY_STEPS.length - 1];

  for (const step of CHART_GRANULARITY_STEPS) {
    const stepMs = granularityToMs(step);
    if (stepMs !== null && rangeMs / stepMs <= CHART_MAX_POINTS) return step;
  }

  return coarsest ?? '1d';
}
