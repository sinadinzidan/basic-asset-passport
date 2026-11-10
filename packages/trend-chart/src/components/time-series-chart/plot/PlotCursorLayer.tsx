import { ReadingKind } from '../../../enums/timeSeriesChart';
import { formatChartTick } from '../../../lib/monitoring/chartModel';
import type { PlotModel } from '../../../lib/monitoring/plotModel';
import { timeToX, windowSpan } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotGeometry } from '../../../lib/time-series-chart/plotNavigation';
import type { HoverReading, MarkerSeriesReading } from '../../../lib/time-series-chart/plotReadouts';
import { laneYPosition } from '../../../lib/time-series-chart/plotSeries';
import { SURFACE_COLOR } from '../../general/charts/chartColors';

import { CROSSHAIR_CHIP_MAX_SPAN_MS, CROSSHAIR_CHIP_WIDTH_PX } from './plotLayout';

export interface DragSelection {
  fromMs: number;
  toMs: number;
}

interface PlotCursorLayerProps {
  model: PlotModel;
  geometry: PlotGeometry;
  width: number;
  hover?: { atMs: number; readings: HoverReading[] };
  marker?: { atMs: number; readings: MarkerSeriesReading[] };
  selection?: DragSelection;
}

const CURSOR_COLOR = 'var(--foreground)';
const CHIP_HEIGHT_PX = 18;
const HANDLE_WIDTH_PX = 10;
const HANDLE_HEIGHT_PX = 14;
const DOT_RADIUS = 4;

function TimeChip({ atMs, x, geometry, width }: { atMs: number; x: number; geometry: PlotGeometry; width: number }) {
  const label = formatChartTick(atMs, Math.min(windowSpan(geometry.window), CROSSHAIR_CHIP_MAX_SPAN_MS));
  const half = CROSSHAIR_CHIP_WIDTH_PX / 2;
  return (
    <g>
      <rect
        x={Math.min(Math.max(x - half, 0), width - CROSSHAIR_CHIP_WIDTH_PX)}
        y={geometry.bottom + 3}
        width={CROSSHAIR_CHIP_WIDTH_PX}
        height={CHIP_HEIGHT_PX}
        rx="9"
        fill={CURSOR_COLOR}
      />
      <text
        x={Math.min(Math.max(x, half), width - half)}
        y={geometry.bottom + 16}
        textAnchor="middle"
        fontSize="11"
        fill="var(--background)"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * The parts of the plot that move with the pointer: the hover crosshair with a dot on each series, or the vertical marker with the
 * reading of each series, and the span being dragged. Kept apart from the plot layer so a move redraws only this.
 */
export function PlotCursorLayer({ model, geometry, width, hover, marker, selection }: PlotCursorLayerProps) {
  const hoverX = hover ? timeToX(geometry, hover.atMs) : undefined;
  const markerX = marker ? timeToX(geometry, marker.atMs) : undefined;

  return (
    <g pointerEvents="none" data-testid="plot-cursor-layer">
      {hover && hoverX !== undefined ? (
        <g data-testid="crosshair">
          <line
            x1={hoverX}
            x2={hoverX}
            y1={geometry.top}
            y2={geometry.bottom}
            stroke={CURSOR_COLOR}
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
          {hover.readings.map(({ entry, bucket }) => {
            const y = bucket && bucket.average !== null ? laneYPosition(model, entry.id, bucket.average) : undefined;
            return y === undefined || !bucket ? null : (
              <circle
                key={entry.id}
                cx={timeToX(geometry, bucket.atMs)}
                cy={y}
                r={DOT_RADIUS}
                fill={entry.color}
                stroke={SURFACE_COLOR}
                strokeWidth="2"
              />
            );
          })}
          <TimeChip atMs={hover.atMs} x={hoverX} geometry={geometry} width={width} />
        </g>
      ) : null}

      {marker && markerX !== undefined ? (
        <g data-testid="vertical-marker" data-at={marker.atMs}>
          <line
            x1={markerX}
            x2={markerX}
            y1={geometry.top}
            y2={geometry.bottom}
            stroke={CURSOR_COLOR}
            strokeOpacity="0.8"
            strokeWidth="1.5"
          />
          <rect
            x={markerX - HANDLE_WIDTH_PX / 2}
            y={geometry.top - HANDLE_HEIGHT_PX / 2}
            width={HANDLE_WIDTH_PX}
            height={HANDLE_HEIGHT_PX}
            rx="3"
            fill={CURSOR_COLOR}
          />
          {marker.readings.map(({ entry, reading }) => {
            const y = reading.value === null ? undefined : laneYPosition(model, entry.id, reading.value);
            if (y === undefined) return null;
            const x =
              reading.readingAt !== undefined && reading.kind === ReadingKind.NEAREST
                ? timeToX(geometry, reading.readingAt)
                : markerX;
            const isInterpolated = reading.kind === ReadingKind.INTERPOLATED;
            return (
              <circle
                key={entry.id}
                cx={x}
                cy={y}
                r={DOT_RADIUS}
                fill={isInterpolated ? SURFACE_COLOR : entry.color}
                stroke={isInterpolated ? entry.color : SURFACE_COLOR}
                strokeWidth="2"
                data-reading-kind={reading.kind}
              />
            );
          })}
          <TimeChip atMs={marker.atMs} x={markerX} geometry={geometry} width={width} />
        </g>
      ) : null}

      {selection ? (
        <rect
          x={timeToX(geometry, selection.fromMs)}
          y={geometry.top}
          width={Math.max(1, timeToX(geometry, selection.toMs) - timeToX(geometry, selection.fromMs))}
          height={geometry.bottom - geometry.top}
          rx="6"
          fill="var(--active-background)"
          fillOpacity="0.12"
          stroke="var(--active-background)"
          strokeOpacity="0.6"
          strokeDasharray="4 3"
          data-testid="zoom-selection"
        />
      ) : null}
    </g>
  );
}
