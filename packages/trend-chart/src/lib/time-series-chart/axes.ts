import { AxisScaleMode } from '../../enums/timeSeriesChart';
import type { AxisSetting } from '../../types/timeSeriesChart';

export interface AxisLimitResult {
  setting: AxisSetting;
  error?: string;
}

function parseLimit(text: string): number | undefined | 'INVALID' {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed.length === 0) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 'INVALID';
}

export function validateAxisLimits(
  seriesId: string,
  minText: string,
  maxText: string,
  previous: AxisSetting,
): AxisLimitResult {
  const min = parseLimit(minText);
  const max = parseLimit(maxText);
  if (min === 'INVALID') return { setting: previous, error: 'The minimum must be a number.' };
  if (max === 'INVALID') return { setting: previous, error: 'The maximum must be a number.' };
  if (min !== undefined && max !== undefined && min >= max)
    return { setting: previous, error: 'The minimum must be lower than the maximum.' };
  if (min === undefined && max === undefined) return { setting: { seriesId, mode: AxisScaleMode.AUTO } };
  return { setting: { seriesId, mode: AxisScaleMode.MANUAL, min, max } };
}

export function axisSettingFor(axes: readonly AxisSetting[], seriesId: string): AxisSetting {
  return axes.find((setting) => setting.seriesId === seriesId) ?? { seriesId, mode: AxisScaleMode.AUTO };
}

export function applyAxisSetting(
  automatic: { minimum: number; maximum: number },
  setting: AxisSetting,
): { minimum: number; maximum: number } {
  if (setting.mode !== AxisScaleMode.MANUAL) return automatic;
  const minimum = setting.min ?? automatic.minimum;
  const maximum = setting.max ?? automatic.maximum;
  return minimum < maximum ? { minimum, maximum } : automatic;
}

export function withAxisSetting(axes: readonly AxisSetting[], setting: AxisSetting): AxisSetting[] {
  const others = axes.filter((candidate) => candidate.seriesId !== setting.seriesId);
  return setting.mode === AxisScaleMode.AUTO ? others : [...others, setting];
}
