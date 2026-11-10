import { memo } from 'react';

import type { PlotModel } from '../../../lib/monitoring/plotModel';
import { timeToX } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotGeometry } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotSeries } from '../../../lib/time-series-chart/plotSeries';
import type { ChartEvent } from '../../../types/timeSeriesChart';

import { EventGlyph } from './EventGlyph';
import { PlotAxes } from './PlotAxes';
import { EVENT_BOTTOM_INSET_PX, clipPathId, hatchPatternId } from './plotLayout';
import { PlotSeriesLayer } from './PlotSeriesLayer';

export interface PlotLayerProps {
  model: PlotModel;
  geometry: PlotGeometry;
  series: readonly PlotSeries[];
  showGridlines: boolean;
  showGaps: boolean;
  showBand: boolean;
  events: readonly ChartEvent[];
  isLive: boolean;
  nowMs: number;
  idPrefix: string;
}

const MUTED = 'var(--muted-foreground)';
const NOW_EDGE_COLOR = 'var(--foreground)';
const HATCH_SIZE_PX = 6;

/**
 * Everything the plot draws apart from the cursor: axes, series, thresholds, indicators, events and the live edge. It is memoised,
 * so moving the crosshair or the marker redraws only the cursor layer and not the lines.
 */
export const PlotLayer = memo(function PlotLayer({
  model,
  geometry,
  series,
  showGridlines,
  showGaps,
  showBand,
  events,
  isLive,
  nowMs,
  idPrefix,
}: PlotLayerProps) {
  const isNowVisible = isLive && nowMs >= geometry.window.start && nowMs <= geometry.window.end;
  const visibleEvents = events.filter((event) => event.at >= geometry.window.start && event.at <= geometry.window.end);

  return (
    <g data-testid="plot-layer">
      <defs>
        <pattern
          id={hatchPatternId(idPrefix)}
          width={HATCH_SIZE_PX}
          height={HATCH_SIZE_PX}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2={HATCH_SIZE_PX} stroke={MUTED} strokeOpacity="0.45" strokeWidth="2" />
        </pattern>
        {model.lanes.map((lane) => (
          <clipPath key={lane.index} id={clipPathId(idPrefix, lane.index)}>
            <rect x={model.plotLeft} y={lane.top} width={model.plotRight - model.plotLeft} height={lane.height} />
          </clipPath>
        ))}
      </defs>

      <PlotAxes model={model} geometry={geometry} series={series} showGridlines={showGridlines} />
      <PlotSeriesLayer
        model={model}
        geometry={geometry}
        series={series}
        showGaps={showGaps}
        showBand={showBand}
        idPrefix={idPrefix}
      />

      {isNowVisible ? (
        <g data-testid="now-edge">
          <line
            x1={timeToX(geometry, nowMs)}
            x2={timeToX(geometry, nowMs)}
            y1={geometry.top}
            y2={geometry.bottom}
            stroke={NOW_EDGE_COLOR}
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <text x={timeToX(geometry, nowMs) - 4} y={geometry.top - 7} textAnchor="end" fontSize="10" fill={MUTED}>
            Now
          </text>
        </g>
      ) : null}

      {visibleEvents.map((event) => (
        <EventGlyph
          key={event.id}
          event={event}
          x={timeToX(geometry, event.at)}
          bottom={geometry.bottom - EVENT_BOTTOM_INSET_PX}
        />
      ))}
    </g>
  );
});
