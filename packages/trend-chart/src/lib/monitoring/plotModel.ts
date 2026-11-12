import {
  PERCENT_FULL,
  PERCENT_HALF,
  PERCENT_QUARTER,
  PERCENT_THREE_QUARTERS,
} from '../../constants/mathConstants';
import { AxisSide } from '../../enums/axisSide';
import { ChartMode } from '../../enums/monitoring';
import { AxisScaleMode } from '../../enums/timeSeriesChart';
import type { AxisSetting } from '../../types/timeSeriesChart';
import { applyAxisSetting, axisSettingFor } from '../time-series-chart/axes';

import { groupAxesByUnit, niceScale, normaliseValue, observedExtent } from './chartModel';
import type { ChartBucket, NiceScale } from './chartModel';

export const AXIS_WIDTH_PX = 54;
export const PLOT_PADDING_PX = 10;
export const PLOT_TOP_PX = 22;
export const TIME_AXIS_HEIGHT_PX = 30;
export const LANE_GAP_PX = 22;
/** The value axes may take at most this share of the width; beyond it axes are shared by unit, then the series are normalised. */
export const MAX_AXES_SHARE_OF_WIDTH = 0.45;
export const NORMALISED_DOMAIN: NiceScale = {
  minimum: 0,
  maximum: 100,
  ticks: [0, PERCENT_QUARTER, PERCENT_HALF, PERCENT_THREE_QUARTERS, PERCENT_FULL],
};
const TICK_TARGET_OVERLAID = 6;
const MIN_TICK_TARGET_OVERLAID = 3;
const TICK_SPACING_PX = 45;
const TICK_TARGET_LANE = 3;

export interface LimitValues {
  alertLow?: number;
  alertHigh?: number;
  dangerLow?: number;
  dangerHigh?: number;
}

export interface PlotSeriesInput {
  id: string;
  unit: string;
  buckets: readonly ChartBucket[];
  limits: LimitValues;
  shouldShowLimits: boolean;
}

export interface AxisModel {
  id: string;
  unit: string;
  side: AxisSide;
  slot: number;
  domain: NiceScale;
  laneIndex: number;
  seriesIds: string[];
  isNormalised: boolean;
}

export interface LaneModel {
  index: number;
  top: number;
  height: number;
}

export interface SeriesScale {
  seriesId: string;
  laneIndex: number;
  domain: NiceScale;
  extent?: { minimum: number; maximum: number };
  isNormalised: boolean;
}

export interface PlotModel {
  /** The mode drawn: Overlaid falls back to Normalised when the signals use more than three units. */
  mode: ChartMode;
  didSwitchToNormalised: boolean;
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  axes: AxisModel[];
  lanes: LaneModel[];
  scales: Map<string, SeriesScale>;
}

function collectValues(series: readonly PlotSeriesInput[], shouldShowBand: boolean): number[] {
  const values: number[] = [];
  for (const entry of series) {
    for (const bucket of entry.buckets) {
      if (bucket.average === null) continue;
      values.push(
        shouldShowBand && bucket.minimum !== null && bucket.maximum !== null
          ? bucket.minimum
          : bucket.average,
      );
      if (shouldShowBand && bucket.maximum !== null) values.push(bucket.maximum);
    }
    if (entry.shouldShowLimits) {
      for (const limit of [
        entry.limits.alertLow,
        entry.limits.alertHigh,
        entry.limits.dangerLow,
        entry.limits.dangerHigh,
      ]) {
        if (limit !== undefined) values.push(limit);
      }
    }
  }
  return values;
}

/** The automatic scale with the manual limits of the unit laid over it; the ticks then stay inside the exact limits. */
function withManualLimits(scale: NiceScale, setting: AxisSetting, tickTarget: number): NiceScale {
  const domain = applyAxisSetting({ minimum: scale.minimum, maximum: scale.maximum }, setting);
  if (domain.minimum === scale.minimum && domain.maximum === scale.maximum) return scale;
  const ticks = niceScale(domain.minimum, domain.maximum, tickTarget).ticks.filter(
    (tick) => tick >= domain.minimum && tick <= domain.maximum,
  );
  return { minimum: domain.minimum, maximum: domain.maximum, ticks };
}

function domainOf(
  series: readonly PlotSeriesInput[],
  shouldShowBand: boolean,
  tickTarget: number,
  setting: AxisSetting,
): NiceScale {
  const values = collectValues(series, shouldShowBand);
  const automatic =
    values.length === 0
      ? niceScale(0, 1, tickTarget)
      : niceScale(Math.min(...values), Math.max(...values), tickTarget);
  return withManualLimits(automatic, setting, tickTarget);
}

function tickTargetFor(plotHeight: number): number {
  return Math.min(
    TICK_TARGET_OVERLAID,
    Math.max(MIN_TICK_TARGET_OVERLAID, Math.round(plotHeight / TICK_SPACING_PX)),
  );
}

export interface PlotModelInput {
  series: readonly PlotSeriesInput[];
  mode: ChartMode;
  width: number;
  plotHeight: number;
  laneHeight: number;
  shouldShowBand: boolean;
  axes?: readonly AxisSetting[];
}

export function buildPlotModel(input: PlotModelInput): PlotModel {
  const { series, width, shouldShowBand } = input;
  const axisSettings = input.axes ?? [];
  const unitGroups = groupAxesByUnit(series);
  const room = Math.max(1, Math.floor((width * MAX_AXES_SHARE_OF_WIDTH) / AXIS_WIDTH_PX));
  const isAxisPerSeries = series.length <= room;
  const didSwitchToNormalised =
    input.mode === ChartMode.OVERLAID && !isAxisPerSeries && unitGroups.groups.length > room;
  const mode = didSwitchToNormalised ? ChartMode.NORMALISED : input.mode;
  const scales = new Map<string, SeriesScale>();
  const axes: AxisModel[] = [];
  const lanes: LaneModel[] = [];

  if (mode === ChartMode.STACKED) {
    series.forEach((entry, index) => {
      lanes.push({
        index,
        top: PLOT_TOP_PX + index * (input.laneHeight + LANE_GAP_PX),
        height: input.laneHeight,
      });
      const domain = domainOf(
        [entry],
        shouldShowBand,
        TICK_TARGET_LANE,
        axisSettingFor(axisSettings, entry.id),
      );
      axes.push({
        id: `axis-${entry.id}`,
        unit: entry.unit,
        side: AxisSide.LEFT,
        slot: 0,
        domain,
        laneIndex: index,
        seriesIds: [entry.id],
        isNormalised: false,
      });
      scales.set(entry.id, { seriesId: entry.id, laneIndex: index, domain, isNormalised: false });
    });
  } else if (mode === ChartMode.NORMALISED) {
    lanes.push({ index: 0, top: PLOT_TOP_PX, height: input.plotHeight });
    axes.push({
      id: 'axis-normalised',
      unit: '%',
      side: AxisSide.LEFT,
      slot: 0,
      domain: NORMALISED_DOMAIN,
      laneIndex: 0,
      seriesIds: series.map((entry) => entry.id),
      isNormalised: true,
    });
    for (const entry of series) {
      scales.set(entry.id, {
        seriesId: entry.id,
        laneIndex: 0,
        domain: NORMALISED_DOMAIN,
        extent: observedExtent(entry.buckets),
        isNormalised: true,
      });
    }
  } else {
    lanes.push({ index: 0, top: PLOT_TOP_PX, height: input.plotHeight });
    // Each series has an axis of its own, side by side on the left. When they would take too much of the width,
    const groups = isAxisPerSeries
      ? series.map((entry) => ({ unit: entry.unit, seriesIds: [entry.id] }))
      : unitGroups.groups;
    groups.forEach((group, groupIndex) => {
      const members = series.filter((entry) => group.seriesIds.includes(entry.id));
      const setting =
        members
          .map((entry) => axisSettingFor(axisSettings, entry.id))
          .find((candidate) => candidate.mode === AxisScaleMode.MANUAL) ??
        axisSettingFor(axisSettings, group.seriesIds[0] ?? '');
      const domain = domainOf(members, shouldShowBand, tickTargetFor(input.plotHeight), setting);
      axes.push({
        id: `axis-${groupIndex}`,
        unit: group.unit,
        side: AxisSide.LEFT,
        slot: groupIndex,
        domain,
        laneIndex: 0,
        seriesIds: group.seriesIds,
        isNormalised: false,
      });
      for (const entry of members)
        scales.set(entry.id, { seriesId: entry.id, laneIndex: 0, domain, isNormalised: false });
    });
  }

  const leftSlots = Math.max(
    1,
    ...axes.filter((axis) => axis.side === AxisSide.LEFT).map((axis) => axis.slot + 1),
  );
  const rightSlots = Math.max(
    0,
    ...axes.filter((axis) => axis.side === AxisSide.RIGHT).map((axis) => axis.slot + 1),
  );
  const lastLane = lanes[lanes.length - 1];
  const height = lastLane
    ? lastLane.top + lastLane.height + TIME_AXIS_HEIGHT_PX
    : PLOT_TOP_PX + input.plotHeight + TIME_AXIS_HEIGHT_PX;
  return {
    mode,
    didSwitchToNormalised,
    width,
    height,
    plotLeft: leftSlots * AXIS_WIDTH_PX + PLOT_PADDING_PX,
    plotRight: width - rightSlots * AXIS_WIDTH_PX - PLOT_PADDING_PX,
    axes,
    lanes,
    scales,
  };
}

export function yPosition(model: PlotModel, seriesId: string, value: number): number | undefined {
  const scale = model.scales.get(seriesId);
  const lane = scale ? model.lanes[scale.laneIndex] : undefined;
  if (!scale || !lane) return undefined;
  const plotted = scale.isNormalised
    ? scale.extent
      ? normaliseValue(value, scale.extent.minimum, scale.extent.maximum)
      : undefined
    : value;
  if (plotted === undefined) return undefined;
  const span = scale.domain.maximum - scale.domain.minimum || 1;
  return lane.top + lane.height - ((plotted - scale.domain.minimum) / span) * lane.height;
}
