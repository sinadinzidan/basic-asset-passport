import { formatDateTime, formatShortDateTime } from '../../../lib/format';

export const FACT_SEPARATOR = ' · ';

export function formatChartInstant(timestamp: number): string {
  return formatDateTime(new Date(timestamp).toISOString());
}

export function formatChartInstantShort(timestamp: number): string {
  return formatShortDateTime(new Date(timestamp).toISOString());
}

export function formatCountOf(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? singular : plural}`;
}
