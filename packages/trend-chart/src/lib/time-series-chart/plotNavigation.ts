import { CHART_MIN_WINDOW_MINUTES, MILLISECONDS_PER_MINUTE } from '../../constants/monitoring';
import type { ChartTimeRange } from '../../types/timeSeriesChart';

export const MINIMUM_WINDOW_MS = CHART_MIN_WINDOW_MINUTES * MILLISECONDS_PER_MINUTE;

export function windowSpan(window: ChartTimeRange): number {
  return window.end - window.start;
}

export function isSameWindow(first: ChartTimeRange, second: ChartTimeRange): boolean {
  return first.start === second.start && first.end === second.end;
}

export function clampWindow(window: ChartTimeRange, bounds: ChartTimeRange): ChartTimeRange {
  const boundsSpan = windowSpan(bounds);
  if (boundsSpan <= MINIMUM_WINDOW_MS) return { start: bounds.start, end: bounds.end };
  const span = Math.min(boundsSpan, Math.max(MINIMUM_WINDOW_MS, windowSpan(window)));
  const start = Math.min(bounds.end - span, Math.max(bounds.start, window.start));
  return { start, end: start + span };
}

export function zoomWindow(
  window: ChartTimeRange,
  bounds: ChartTimeRange,
  spanRatio: number,
  anchorMs: number,
): ChartTimeRange {
  const span = windowSpan(window);
  if (span <= 0) return clampWindow(window, bounds);
  const anchorShare = Math.min(1, Math.max(0, (anchorMs - window.start) / span));
  const nextSpan = Math.min(
    Math.max(MINIMUM_WINDOW_MS, span * spanRatio),
    Math.max(MINIMUM_WINDOW_MS, windowSpan(bounds)),
  );
  const start = anchorMs - anchorShare * nextSpan;
  return clampWindow({ start, end: start + nextSpan }, bounds);
}

export function panWindow(
  window: ChartTimeRange,
  bounds: ChartTimeRange,
  deltaMs: number,
): ChartTimeRange {
  return clampWindow({ start: window.start + deltaMs, end: window.end + deltaMs }, bounds);
}

/** A dragged span becomes the window; undefined when it is narrower than the minimum window, so a stray click never zooms. */
export function dragWindow(
  bounds: ChartTimeRange,
  firstMs: number,
  secondMs: number,
): ChartTimeRange | undefined {
  const start = Math.max(bounds.start, Math.min(firstMs, secondMs));
  const end = Math.min(bounds.end, Math.max(firstMs, secondMs));
  if (end - start < MINIMUM_WINDOW_MS) return undefined;
  return { start, end };
}

export interface PlotGeometry {
  left: number;
  right: number;
  top: number;
  bottom: number;
  window: ChartTimeRange;
}

export function plotWidth(geometry: PlotGeometry): number {
  return Math.max(1, geometry.right - geometry.left);
}

export function timeToX(geometry: PlotGeometry, atMs: number): number {
  return (
    geometry.left +
    ((atMs - geometry.window.start) / Math.max(1, windowSpan(geometry.window))) *
      plotWidth(geometry)
  );
}

export function xToTime(geometry: PlotGeometry, xInPlot: number): number {
  const width = plotWidth(geometry);
  return (
    geometry.window.start +
    (Math.min(Math.max(xInPlot, 0), width) / width) * windowSpan(geometry.window)
  );
}
