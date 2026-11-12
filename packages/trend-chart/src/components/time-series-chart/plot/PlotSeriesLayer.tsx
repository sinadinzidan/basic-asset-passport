import { ALERT_LIMIT_COLOR, DANGER_LIMIT_COLOR } from '../../../constants/monitoring';
import { THRESHOLD_LEVEL_LABELS } from '../../../constants/timeSeriesChart';
import { ExtremeKind } from '../../../enums/extremeKind';
import { ChartMode } from '../../../enums/monitoring';
import { ThresholdLevel, ThresholdSide } from '../../../enums/timeSeriesChart';
import { findGapSpans, splitIntoRuns } from '../../../lib/monitoring/chartModel';
import type { ChartBucket } from '../../../lib/monitoring/chartModel';
import { yPosition } from '../../../lib/monitoring/plotModel';
import type { PlotModel } from '../../../lib/monitoring/plotModel';
import { formatSignalValue, formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import { formatPlotTimestamp } from '../../../lib/time-series-chart/plotFormat';
import { timeToX } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotGeometry } from '../../../lib/time-series-chart/plotNavigation';
import { bucketsOfBreach, laneYPosition } from '../../../lib/time-series-chart/plotSeries';
import type { ExtremeReading, PlotSeries } from '../../../lib/time-series-chart/plotSeries';
import { SURFACE_COLOR } from '../../general/charts/chartColors';

import {
  BAND_OPACITY,
  MIN_MAX_LABEL_EDGE_PX,
  THRESHOLD_BREACH_WIDTH_FACTOR,
  clipPathId,
  hatchPatternId,
} from './plotLayout';

const INDICATOR_LABEL_DROP_PX = 4;
const LABEL_BOTTOM_INSET_PX = 3;
const LABEL_TOP_INSET_PX = 10;
const LANE_LABEL_LEFT_INSET_PX = 6;
const LANE_LABEL_TOP_INSET_PX = 13;
const THRESHOLD_LABEL_RIGHT_INSET_PX = 4;
const THRESHOLD_LABEL_BELOW_PX = 11;
const THRESHOLD_LABEL_ABOVE_PX = 3;

interface PlotSeriesLayerProperties {
  model: PlotModel;
  geometry: PlotGeometry;
  series: readonly PlotSeries[];
  shouldShowGaps: boolean;
  shouldShowBand: boolean;
  idPrefix: string;
}

const THRESHOLD_COLORS: Record<ThresholdLevel, string> = {
  [ThresholdLevel.ALERT]: ALERT_LIMIT_COLOR,
  [ThresholdLevel.DANGER]: DANGER_LIMIT_COLOR,
};
const THRESHOLD_DASH = '8 4';
const LABEL_HALO_WIDTH = 3;
const INDICATOR_RADIUS = 4;
const INDICATOR_LABEL_OFFSET_PX = 9;
const SINGLE_READING_RADIUS = 2.5;
const BREACH_DOT_RADIUS = 3;

function pointsOf(
  model: PlotModel,
  geometry: PlotGeometry,
  seriesId: string,
  buckets: readonly ChartBucket[],
): Array<{ x: number; y: number }> {
  return buckets.flatMap((bucket) => {
    const yCoordinate =
      bucket.average === null ? undefined : yPosition(model, seriesId, bucket.average);
    return yCoordinate === undefined ? [] : [{ x: timeToX(geometry, bucket.atMs), y: yCoordinate }];
  });
}

function toPolyline(points: ReadonlyArray<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
}

function bandPolygon(
  model: PlotModel,
  geometry: PlotGeometry,
  seriesId: string,
  run: readonly ChartBucket[],
): string | undefined {
  const upper: string[] = [];
  const lower: string[] = [];
  for (const bucket of run) {
    if (bucket.maximum === null || bucket.minimum === null) continue;
    const top = yPosition(model, seriesId, bucket.maximum);
    const bottom = yPosition(model, seriesId, bucket.minimum);
    if (top === undefined || bottom === undefined) continue;
    const xCoordinate = timeToX(geometry, bucket.atMs);
    upper.push(`${xCoordinate.toFixed(1)},${top.toFixed(1)}`);
    lower.unshift(`${xCoordinate.toFixed(1)},${bottom.toFixed(1)}`);
  }
  return upper.length > 1 ? [...upper, ...lower].join(' ') : undefined;
}

interface IndicatorProperties {
  kind: ExtremeKind;
  reading: ExtremeReading;
  entry: PlotSeries;
  model: PlotModel;
  geometry: PlotGeometry;
}

function ExtremeIndicator({ kind, reading, entry, model, geometry }: IndicatorProperties) {
  const scale = model.scales.get(entry.id);
  const lane = scale ? model.lanes[scale.laneIndex] : undefined;
  const yCoordinate = laneYPosition(model, entry.id, reading.value);
  if (!lane || yCoordinate === undefined) return null;
  const xCoordinate = timeToX(geometry, reading.timestamp);
  const isMax = kind !== ExtremeKind.MIN;
  const wantedY = isMax
    ? yCoordinate - INDICATOR_LABEL_OFFSET_PX
    : yCoordinate + INDICATOR_LABEL_OFFSET_PX + INDICATOR_LABEL_DROP_PX;
  const labelY = Math.min(
    lane.top + lane.height - LABEL_BOTTOM_INSET_PX,
    Math.max(lane.top + LABEL_TOP_INSET_PX, wantedY),
  );
  const isNearLeft = xCoordinate < geometry.left + MIN_MAX_LABEL_EDGE_PX;
  const isNearRight = xCoordinate > geometry.right - MIN_MAX_LABEL_EDGE_PX;
  const anchor = isNearLeft ? 'start' : isNearRight ? 'end' : 'middle';
  const name = kind === ExtremeKind.BOTH ? 'Min/Max' : isMax ? 'Max' : 'Min';
  const text = `${name} ${formatSignalValue(reading.value)}`;
  const description = `${kind === ExtremeKind.BOTH ? 'Minimum and maximum' : isMax ? 'Maximum' : 'Minimum'} of ${entry.label} in the visible period: ${formatSignalWithUnit(reading.value, entry.unit)} at ${formatPlotTimestamp(reading.timestamp)}`;
  return (
    <g
      data-testid="min-max-indicator"
      data-series={entry.id}
      data-extreme={kind}
      data-value={reading.value}
    >
      <title>{description}</title>
      <circle
        cx={xCoordinate}
        cy={yCoordinate}
        r={INDICATOR_RADIUS}
        fill={SURFACE_COLOR}
        stroke={entry.color}
        strokeWidth="2"
      />
      <text
        x={xCoordinate}
        y={labelY}
        textAnchor={anchor}
        fontSize="10"
        fontWeight="600"
        fill={entry.color}
        stroke={SURFACE_COLOR}
        strokeWidth={LABEL_HALO_WIDTH}
        paintOrder="stroke"
      >
        {text}
      </text>
    </g>
  );
}

/**
 * What belongs to the series themselves: hatched gaps, the min-max band, threshold lines with the stretches beyond them, the
 * lines (one run at a time, so a missing reading is never joined up or drawn as zero) and the min/max indicators.
 */
export function PlotSeriesLayer({
  model,
  geometry,
  series,
  shouldShowGaps,
  shouldShowBand,
  idPrefix,
}: PlotSeriesLayerProperties) {
  const isStacked = model.mode === ChartMode.STACKED;
  const windowMs = { fromMs: geometry.window.start, toMs: geometry.window.end };

  return (
    <g data-testid="plot-series">
      {isStacked
        ? series.map((entry, index) => {
            const lane = model.lanes[index];
            return lane ? (
              <text
                key={`title-${entry.id}`}
                x={model.plotLeft + LANE_LABEL_LEFT_INSET_PX}
                y={lane.top + LANE_LABEL_TOP_INSET_PX}
                fontSize="11"
                fontWeight="600"
                fill={entry.color}
                data-testid="lane-title"
              >
                {entry.label}
              </text>
            ) : null;
          })
        : null}

      {series.map((entry) => {
        const scale = model.scales.get(entry.id);
        const lane = scale ? model.lanes[scale.laneIndex] : undefined;
        if (!scale || !lane) return null;
        // A series with nothing to draw is hatched across its own lane only; in a shared plot that would hide the other series.
        const isGapShown = shouldShowGaps && (entry.hasValues || isStacked);
        return (
          <g
            key={entry.id}
            clipPath={`url(#${clipPathId(idPrefix, lane.index)})`}
            data-series-layer={entry.id}
          >
            {isGapShown
              ? findGapSpans(entry.buckets, windowMs).map((gap) => {
                  const xCoordinate = Math.max(model.plotLeft, timeToX(geometry, gap.fromMs));
                  const gapWidth =
                    Math.min(model.plotRight, timeToX(geometry, gap.toMs)) - xCoordinate;
                  return gapWidth > 0 ? (
                    <rect
                      key={`gap-${gap.fromMs}`}
                      x={xCoordinate}
                      y={lane.top}
                      width={gapWidth}
                      height={lane.height}
                      fill={`url(#${hatchPatternId(idPrefix)})`}
                      data-gap={entry.id}
                    />
                  ) : null;
                })
              : null}

            {entry.thresholds.map((threshold) => {
              const yCoordinate = yPosition(model, entry.id, threshold.value);
              if (
                yCoordinate === undefined ||
                yCoordinate < lane.top ||
                yCoordinate > lane.top + lane.height
              )
                return null;
              const colour = THRESHOLD_COLORS[threshold.level];
              const isLower = threshold.side === ThresholdSide.LOWER;
              return (
                <g
                  key={threshold.id}
                  data-testid="threshold-line"
                  data-series={entry.id}
                  data-level={threshold.level}
                  data-side={threshold.side}
                >
                  <line
                    x1={model.plotLeft}
                    x2={model.plotRight}
                    y1={yCoordinate}
                    y2={yCoordinate}
                    stroke={colour}
                    strokeWidth="1.25"
                    strokeDasharray={THRESHOLD_DASH}
                  />
                  <text
                    x={model.plotRight - THRESHOLD_LABEL_RIGHT_INSET_PX}
                    y={
                      isLower
                        ? yCoordinate + THRESHOLD_LABEL_BELOW_PX
                        : yCoordinate - THRESHOLD_LABEL_ABOVE_PX
                    }
                    textAnchor="end"
                    fontSize="10"
                    fill={colour}
                    stroke={SURFACE_COLOR}
                    strokeWidth={LABEL_HALO_WIDTH}
                    paintOrder="stroke"
                  >
                    {`${threshold.label ?? THRESHOLD_LEVEL_LABELS[threshold.level]} ${formatSignalValue(threshold.value)} ${threshold.unit || entry.unit}`.trim()}
                  </text>
                </g>
              );
            })}

            {splitIntoRuns(entry.buckets).map((run) => {
              const points = pointsOf(model, geometry, entry.id, run);
              const first = points[0];
              const firstBucket = run[0];
              if (!first || !firstBucket) return null;
              const band =
                shouldShowBand && !scale.isNormalised
                  ? bandPolygon(model, geometry, entry.id, run)
                  : undefined;
              return (
                <g key={firstBucket.atMs} data-series={entry.id}>
                  {band ? (
                    <polygon
                      points={band}
                      fill={entry.color}
                      fillOpacity={BAND_OPACITY}
                      stroke="none"
                      data-testid="min-max-band"
                    />
                  ) : null}
                  {points.length === 1 ? (
                    <circle
                      cx={first.x}
                      cy={first.y}
                      r={SINGLE_READING_RADIUS}
                      fill={entry.color}
                      data-testid="series-reading"
                    />
                  ) : (
                    <polyline
                      points={toPolyline(points)}
                      fill="none"
                      stroke={entry.color}
                      strokeWidth={entry.lineWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray={entry.dashArray}
                      data-testid="series-line"
                    />
                  )}
                </g>
              );
            })}

            {entry.breaches.map((breach) => {
              const points = pointsOf(
                model,
                geometry,
                entry.id,
                bucketsOfBreach(entry, breach, geometry.window),
              );
              const first = points[0];
              if (!first) return null;
              const colour = THRESHOLD_COLORS[breach.threshold.level];
              return (
                <g
                  key={`${breach.threshold.id}-${breach.from}`}
                  data-testid="threshold-breach"
                  data-series={entry.id}
                  data-level={breach.threshold.level}
                >
                  {points.length > 1 ? (
                    <polyline
                      points={toPolyline(points)}
                      fill="none"
                      stroke={colour}
                      strokeWidth={entry.lineWidth * THRESHOLD_BREACH_WIDTH_FACTOR}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeOpacity="0.85"
                    />
                  ) : null}
                  <circle cx={first.x} cy={first.y} r={BREACH_DOT_RADIUS} fill={colour} />
                </g>
              );
            })}
          </g>
        );
      })}

      {series.map((entry) => {
        const { min, max } = entry;
        // A flat series has one reading that is both its minimum and its maximum.
        const isFlat = min !== undefined && max !== undefined && min.timestamp === max.timestamp;
        return (
          <g key={`extremes-${entry.id}`}>
            {max ? (
              <ExtremeIndicator
                kind={isFlat ? ExtremeKind.BOTH : ExtremeKind.MAX}
                reading={max}
                entry={entry}
                model={model}
                geometry={geometry}
              />
            ) : null}
            {min && !isFlat ? (
              <ExtremeIndicator
                kind={ExtremeKind.MIN}
                reading={min}
                entry={entry}
                model={model}
                geometry={geometry}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
