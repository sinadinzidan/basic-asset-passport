import { AxisSide } from '../../../enums/axisSide';
import { formatNumber } from '../../../lib/format';
import { buildTimeTicks, formatChartTick } from '../../../lib/monitoring/chartModel';
import type { PlotModel } from '../../../lib/monitoring/plotModel';
import { AXIS_WIDTH_PX } from '../../../lib/monitoring/plotModel';
import { formatSignalValue } from '../../../lib/monitoring/signalFormat';
import { timeToX, windowSpan } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotGeometry } from '../../../lib/time-series-chart/plotNavigation';
import type { PlotSeries } from '../../../lib/time-series-chart/plotSeries';
import { GRID_DASH } from '../../general/charts/chartColors';

const TIME_LABEL_OFFSET_PX = 18;
const TICK_LABEL_BASELINE_PX = 4;
const LANE_LABEL_RISE_PX = 7;

interface PlotAxesProperties {
  model: PlotModel;
  geometry: PlotGeometry;
  series: readonly PlotSeries[];
  shouldShowGridlines: boolean;
}

const GRID_COLOR = 'var(--chart-gridlines)';
const MUTED = 'var(--muted-foreground)';
const AXIS_LINE = 'var(--border)';
const TICK_MARK_PX = 4;
const AXIS_LABEL_GAP_PX = 6;

const LAST_TICK_EDGE_PX = 24;

/**
 * Lane backgrounds, the time axis and one value axis per unit. The tick labels and the unit label take the colour of the series
 * when an axis belongs to one series, and the unit label names the series it scales, so it is clear which scale is whose.
 * Gridlines are presentation only: with them off the tick marks and labels keep the axes readable.
 */
export function PlotAxes({ model, geometry, series, shouldShowGridlines }: PlotAxesProperties) {
  const timeTicks = buildTimeTicks({ fromMs: geometry.window.start, toMs: geometry.window.end });
  const span = windowSpan(geometry.window);
  const hasRightAxis = model.axes.some((axis) => axis.side === AxisSide.RIGHT);

  return (
    <g data-testid="plot-axes">
      {model.lanes.map((lane) => (
        <rect
          key={`lane-${lane.index}`}
          x={model.plotLeft}
          y={lane.top}
          width={model.plotRight - model.plotLeft}
          height={lane.height}
          rx="8"
          fill="var(--muted-background)"
          fillOpacity="0.35"
          stroke={AXIS_LINE}
          strokeOpacity="0.8"
        />
      ))}

      {timeTicks.map((tick) => {
        const xCoordinate = timeToX(geometry, tick);
        // With no value axis on the right, the label of the last tick would run past the edge of the picture.
        const isLastTick = !hasRightAxis && model.plotRight - xCoordinate < LAST_TICK_EDGE_PX;
        return (
          <g key={tick}>
            {shouldShowGridlines ? (
              <line
                x1={xCoordinate}
                x2={xCoordinate}
                y1={geometry.top}
                y2={geometry.bottom}
                stroke={GRID_COLOR}
                strokeDasharray={GRID_DASH}
                data-testid="gridline"
                data-direction="time"
              />
            ) : null}
            <line
              x1={xCoordinate}
              x2={xCoordinate}
              y1={geometry.bottom}
              y2={geometry.bottom + TICK_MARK_PX}
              stroke={MUTED}
              strokeOpacity="0.6"
            />
            <text
              x={xCoordinate}
              y={geometry.bottom + TIME_LABEL_OFFSET_PX}
              textAnchor={isLastTick ? 'end' : 'middle'}
              fontSize="11"
              fill={MUTED}
              data-testid="time-tick"
            >
              {formatChartTick(tick, span)}
            </text>
          </g>
        );
      })}

      {model.axes.map((axis) => {
        const lane = model.lanes[axis.laneIndex];
        if (!lane) return null;
        const members = series.filter((entry) => axis.seriesIds.includes(entry.id));
        const onlySeries = members.length === 1 ? members[0] : undefined;
        const colour = onlySeries ? onlySeries.color : MUTED;
        const isLeft = axis.side === AxisSide.LEFT;
        const edgeX = isLeft
          ? model.plotLeft - axis.slot * AXIS_WIDTH_PX
          : model.plotRight + axis.slot * AXIS_WIDTH_PX;
        const tickEndX = isLeft ? edgeX - TICK_MARK_PX : edgeX + TICK_MARK_PX;
        const xCoordinate = isLeft ? tickEndX - AXIS_LABEL_GAP_PX : tickEndX + AXIS_LABEL_GAP_PX;
        const anchor = isLeft ? 'end' : 'start';
        const domainSpan = axis.domain.maximum - axis.domain.minimum || 1;
        const names = members.map((entry) => entry.label).join(', ');
        return (
          <g
            key={axis.id}
            data-testid="value-axis"
            data-axis-unit={axis.unit}
            data-axis-series={axis.seriesIds.join(' ')}
          >
            <line
              x1={edgeX}
              x2={edgeX}
              y1={lane.top}
              y2={lane.top + lane.height}
              stroke={colour}
              strokeWidth="1.5"
              strokeOpacity="0.9"
              data-testid="axis-line"
            />
            {axis.domain.ticks.map((tick) => {
              const yCoordinate =
                lane.top + lane.height - ((tick - axis.domain.minimum) / domainSpan) * lane.height;
              return (
                <g key={tick}>
                  {shouldShowGridlines && axis.slot === 0 && isLeft ? (
                    <line
                      x1={model.plotLeft}
                      x2={model.plotRight}
                      y1={yCoordinate}
                      y2={yCoordinate}
                      stroke={GRID_COLOR}
                      strokeDasharray={GRID_DASH}
                      data-testid="gridline"
                      data-direction="value"
                    />
                  ) : null}
                  <line
                    x1={edgeX}
                    x2={tickEndX}
                    y1={yCoordinate}
                    y2={yCoordinate}
                    stroke={colour}
                    strokeOpacity="0.8"
                  />
                  <text
                    x={xCoordinate}
                    y={yCoordinate + TICK_LABEL_BASELINE_PX}
                    textAnchor={anchor}
                    fontSize="11"
                    fill={colour}
                    data-testid="value-tick"
                  >
                    {axis.isNormalised ? formatNumber(tick, 0) : formatSignalValue(tick)}
                  </text>
                </g>
              );
            })}
            <text
              x={xCoordinate}
              y={lane.top - LANE_LABEL_RISE_PX}
              textAnchor={anchor}
              fontSize="10"
              fontWeight="600"
              fill={colour}
              data-testid="axis-unit"
            >
              <title>{names ? `Scale of ${names}` : 'Value axis'}</title>
              {axis.unit}
            </text>
          </g>
        );
      })}

      <line
        x1={model.plotLeft}
        x2={model.plotRight}
        y1={geometry.bottom}
        y2={geometry.bottom}
        stroke={AXIS_LINE}
      />
    </g>
  );
}
