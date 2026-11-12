import { EventTone } from '../../../enums/eventTone';
export const STATUS_COLORS: Readonly<Record<EventTone, string>> = {
  [EventTone.GOOD]: 'var(--chart-success-color-1)',
  [EventTone.WARNING]: 'var(--chart-warning-color-1)',
  [EventTone.BAD]: 'var(--chart-destructive-color-1)',
  [EventTone.NEUTRAL]: 'var(--chart-neutral-color-1)',
  [EventTone.INFO]: 'var(--chart-info-color-1)',
};

export const GRID_COLOR = 'color-mix(in srgb, var(--chart-gridlines) 70%, transparent)';
export const GRID_DASH = '3 5';
export const SURFACE_COLOR = 'var(--card-background)';
