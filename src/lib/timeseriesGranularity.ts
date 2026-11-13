import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '../constants/time';
import { CHART_GRANULARITY_STEPS, CHART_MAX_POINTS } from '../constants/timeseries';

const UNIT_MS: Record<string, number> = {
  s: MS_PER_SECOND,
  m: MS_PER_MINUTE,
  h: MS_PER_HOUR,
  d: MS_PER_DAY,
};

export function granularityToMs(granularity: string): number | null {
  const match = /^(\d+)([smhd])$/.exec(granularity);

  if (!match) return null;

  const [, count, unit] = match;
  const unitMs = UNIT_MS[unit];
  const amount = Number(count);

  return unitMs === undefined || amount <= 0 ? null : amount * unitMs;
}

export function chooseChartGranularity(rangeMs: number): string {
  const coarsest = CHART_GRANULARITY_STEPS[CHART_GRANULARITY_STEPS.length - 1];

  for (const step of CHART_GRANULARITY_STEPS) {
    const stepMs = granularityToMs(step);

    if (stepMs !== null && rangeMs / stepMs <= CHART_MAX_POINTS) return step;
  }

  return coarsest ?? '1d';
}
