import {
  CHART_COLOR_PALETTE,
  CHART_DEFAULT_MODE,
  CHART_DEFAULT_OVERLAYS,
  CHART_DEFAULT_RANGE_PRESET,
  CHART_DEFAULT_TITLE,
  CHART_LINE_WIDTHS,
  CHART_MAX_CONFIGURED_THRESHOLDS,
  CHART_MAX_SERIES,
  CHART_TITLE_MAX_LENGTH,
  CHART_LINE_WIDTH_THIN,
} from '../../constants/timeSeriesChart';
import { ChartMode, ChartRange } from '../../enums/monitoring';
import {
  AxisScaleMode,
  ChartOverlay,
  ChartPanel,
  LineStyle,
  ThresholdLevel,
  ThresholdSide,
} from '../../enums/timeSeriesChart';
import type {
  AxisSetting,
  ChartConfiguration,
  ChartTimeRange,
  ConfiguredThreshold,
  SeriesConfiguration,
  SeriesStyle,
} from '../../types/timeSeriesChart';
import { isEnumValue } from '../enumGuards';

import { canConvert } from './units';

/** How a switch is written in the shareable options: on is `1` and off is `0`. */
const OPTION_ON = '1';
const OPTION_OFF = '0';

const LIST_SEPARATOR = ',';
const PAIR_SEPARATOR = ';';
const FIELD_SEPARATOR = '|';
const STYLE_SEPARATOR = '.';

const LINE_STYLE_CODES: Record<LineStyle, string> = {
  [LineStyle.SOLID]: 'S',
  [LineStyle.DASHED]: 'D',
  [LineStyle.DOTTED]: 'T',
};

const THRESHOLD_LEVEL_CODES: Record<ThresholdLevel, string> = {
  [ThresholdLevel.ALERT]: 'A',
  [ThresholdLevel.DANGER]: 'D',
};

const THRESHOLD_SIDE_CODES: Record<ThresholdSide, string> = {
  [ThresholdSide.UPPER]: 'U',
  [ThresholdSide.LOWER]: 'L',
};

export interface ConfigurationResult {
  configuration: ChartConfiguration;
  error?: string;
}

export function defaultSeriesStyle(index: number): SeriesStyle {
  return {
    color:
      CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length] ??
      CHART_COLOR_PALETTE[0] ??
      'currentColor',
    lineWidth: CHART_LINE_WIDTHS[0] ?? CHART_LINE_WIDTH_THIN,
    lineStyle: index >= CHART_COLOR_PALETTE.length ? LineStyle.DASHED : LineStyle.SOLID,
  };
}

export function createChartConfiguration(
  seriesIds: readonly string[],
  overrides: Partial<ChartConfiguration> = {},
): ChartConfiguration {
  return {
    title: CHART_DEFAULT_TITLE,
    range: CHART_DEFAULT_RANGE_PRESET,
    mode: CHART_DEFAULT_MODE,
    series: seriesIds
      .slice(0, CHART_MAX_SERIES)
      .map((seriesId, index) => ({ seriesId, isVisible: true, style: defaultSeriesStyle(index) })),
    axes: [],
    thresholds: [],
    shouldShowGridlines: true,
    shouldShowMinMax: false,
    isMarkerMode: false,
    isLive: false,
    overlays: [...CHART_DEFAULT_OVERLAYS],
    ...overrides,
  };
}

export function addSeries(
  configuration: ChartConfiguration,
  seriesId: string,
): ConfigurationResult {
  if (configuration.series.some((entry) => entry.seriesId === seriesId))
    return { configuration, error: 'This series is already on the chart.' };
  if (configuration.series.length >= CHART_MAX_SERIES)
    return { configuration, error: `You can chart up to ${CHART_MAX_SERIES} series.` };
  const entry: SeriesConfiguration = {
    seriesId,
    isVisible: true,
    style: defaultSeriesStyle(configuration.series.length),
  };
  return { configuration: { ...configuration, series: [...configuration.series, entry] } };
}

export function removeSeries(
  configuration: ChartConfiguration,
  seriesId: string,
): ChartConfiguration {
  return {
    ...configuration,
    series: configuration.series.filter((entry) => entry.seriesId !== seriesId),
    thresholds: configuration.thresholds.filter((entry) => entry.seriesId !== seriesId),
  };
}

function updateSeries(
  configuration: ChartConfiguration,
  seriesId: string,
  change: (entry: SeriesConfiguration) => SeriesConfiguration,
): ChartConfiguration {
  return {
    ...configuration,
    series: configuration.series.map((entry) =>
      entry.seriesId === seriesId ? change(entry) : entry,
    ),
  };
}

export function setSeriesVisible(
  configuration: ChartConfiguration,
  seriesId: string,
  isVisible: boolean,
): ChartConfiguration {
  return updateSeries(configuration, seriesId, (entry) => ({ ...entry, isVisible }));
}

export function showAllSeries(configuration: ChartConfiguration): ChartConfiguration {
  return {
    ...configuration,
    series: configuration.series.map((entry) => ({ ...entry, isVisible: true })),
  };
}

export function showOnlySeries(
  configuration: ChartConfiguration,
  seriesId: string,
): ChartConfiguration {
  return {
    ...configuration,
    series: configuration.series.map((entry) => ({
      ...entry,
      isVisible: entry.seriesId === seriesId,
    })),
  };
}

export function setSeriesStyle(
  configuration: ChartConfiguration,
  seriesId: string,
  style: Partial<SeriesStyle>,
): ChartConfiguration {
  return updateSeries(configuration, seriesId, (entry) => ({
    ...entry,
    style: { ...entry.style, ...style },
  }));
}

export function setDisplayUnit(
  configuration: ChartConfiguration,
  seriesId: string,
  ownUnit: string | undefined,
  displayUnit: string | undefined,
): ConfigurationResult {
  if (displayUnit !== undefined && displayUnit !== ownUnit && !canConvert(ownUnit, displayUnit)) {
    return {
      configuration,
      error: `There is no known conversion from ${ownUnit ?? 'this unit'} to ${displayUnit}.`,
    };
  }
  return {
    configuration: updateSeries(configuration, seriesId, (entry) => ({
      ...entry,
      displayUnit: displayUnit === ownUnit ? undefined : displayUnit,
    })),
  };
}

export function moveSeries(
  configuration: ChartConfiguration,
  seriesId: string,
  offset: number,
): ChartConfiguration {
  const from = configuration.series.findIndex((entry) => entry.seriesId === seriesId);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= configuration.series.length) return configuration;
  const next = [...configuration.series];
  const [moved] = next.splice(from, 1);
  if (!moved) return configuration;
  next.splice(to, 0, moved);
  return { ...configuration, series: next };
}

export function toggleOverlay(
  configuration: ChartConfiguration,
  overlay: ChartOverlay,
): ChartConfiguration {
  return {
    ...configuration,
    overlays: configuration.overlays.includes(overlay)
      ? configuration.overlays.filter((candidate) => candidate !== overlay)
      : [...configuration.overlays, overlay],
  };
}

export function togglePanel(
  configuration: ChartConfiguration,
  panel: ChartPanel,
): ChartConfiguration {
  return { ...configuration, panel: configuration.panel === panel ? undefined : panel };
}

export function setTitle(configuration: ChartConfiguration, title: string): ChartConfiguration {
  const trimmed = title.trim().slice(0, CHART_TITLE_MAX_LENGTH);
  return { ...configuration, title: trimmed.length > 0 ? trimmed : CHART_DEFAULT_TITLE };
}

export function setWindow(
  configuration: ChartConfiguration,
  range: ChartRange,
  window: ChartTimeRange | undefined,
): ChartConfiguration {
  return { ...configuration, range, window: range === ChartRange.CUSTOM ? window : undefined };
}

function listOf(text: string | undefined): string[] {
  return text ? text.split(LIST_SEPARATOR).filter((part) => part.length > 0) : [];
}

function numberOf(text: string | undefined): number | undefined {
  if (text === undefined || text.length === 0) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function styleOf(text: string | undefined, index: number): SeriesStyle {
  const base = defaultSeriesStyle(index);
  if (!text) return base;
  const [colorIndex, widthIndex, code] = text.split(STYLE_SEPARATOR);
  const color = CHART_COLOR_PALETTE[Number(colorIndex)];
  const lineWidth = CHART_LINE_WIDTHS[Number(widthIndex)];
  const lineStyle = Object.values(LineStyle).find(
    (candidate) => LINE_STYLE_CODES[candidate] === code,
  );
  return {
    color: color ?? base.color,
    lineWidth: lineWidth ?? base.lineWidth,
    lineStyle: lineStyle ?? base.lineStyle,
  };
}

function styleText(style: SeriesStyle): string {
  const colorIndex = Math.max(0, CHART_COLOR_PALETTE.indexOf(style.color));
  const widthIndex = Math.max(0, CHART_LINE_WIDTHS.indexOf(style.lineWidth));
  return [colorIndex, widthIndex, LINE_STYLE_CODES[style.lineStyle]].join(STYLE_SEPARATOR);
}

/**
 * The view options that carry the chart: what a shared link restores. Defaults are left out so the link stays short,
 * and only values the chart itself offers are written, so a link holds no credentials or free text beyond the title.
 */
export function serialiseConfiguration(configuration: ChartConfiguration): Record<string, string> {
  const options: Record<string, string> = {
    sig: configuration.series.map((entry) => entry.seriesId).join(LIST_SEPARATOR),
    st: configuration.series.map((entry) => styleText(entry.style)).join(LIST_SEPARATOR),
    mode: configuration.mode,
    range: configuration.range,
    ov: configuration.overlays.join(LIST_SEPARATOR),
  };
  if (configuration.title !== CHART_DEFAULT_TITLE) options.title = configuration.title;
  if (configuration.window) {
    options.from = String(configuration.window.start);
    options.to = String(configuration.window.end);
  }
  const hidden = configuration.series
    .filter((entry) => !entry.isVisible)
    .map((entry) => entry.seriesId);
  if (hidden.length > 0) options.hid = hidden.join(LIST_SEPARATOR);
  const units = configuration.series
    .filter((entry) => entry.displayUnit !== undefined)
    .map((entry) => `${entry.seriesId}=${entry.displayUnit}`);
  if (units.length > 0) options.du = units.join(PAIR_SEPARATOR);
  const axes = configuration.axes
    .filter((axis) => axis.mode === AxisScaleMode.MANUAL)
    .map((axis) => [axis.seriesId, axis.min ?? '', axis.max ?? ''].join(FIELD_SEPARATOR));
  if (axes.length > 0) options.ax = axes.join(PAIR_SEPARATOR);
  const thresholds = configuration.thresholds.map((threshold) =>
    [
      threshold.seriesId,
      THRESHOLD_LEVEL_CODES[threshold.level],
      THRESHOLD_SIDE_CODES[threshold.side],
      threshold.value,
      encodeURIComponent(threshold.unit),
    ].join(FIELD_SEPARATOR),
  );
  if (thresholds.length > 0) options.th = thresholds.join(PAIR_SEPARATOR);
  if (!configuration.shouldShowGridlines) options.grid = OPTION_OFF;
  if (configuration.shouldShowMinMax) options.mm = OPTION_ON;
  if (configuration.isMarkerMode) options.mk = OPTION_ON;
  if (configuration.markerAt !== undefined) options.at = String(configuration.markerAt);
  if (configuration.isLive) options.live = OPTION_ON;
  if (configuration.panel) options.pn = configuration.panel;
  return options;
}

/** One added threshold from its place in the link, or nothing when it is malformed or its series is not on the chart. */
function thresholdOf(entry: string, seriesIds: readonly string[]): ConfiguredThreshold[] {
  const [seriesId, levelCode, sideCode, valueText, unitText = ''] = entry.split(FIELD_SEPARATOR);
  const level = Object.values(ThresholdLevel).find(
    (candidate) => THRESHOLD_LEVEL_CODES[candidate] === levelCode,
  );
  const side = Object.values(ThresholdSide).find(
    (candidate) => THRESHOLD_SIDE_CODES[candidate] === sideCode,
  );
  const value = numberOf(valueText);

  if (!seriesId || !seriesIds.includes(seriesId) || !level || !side || value === undefined)
    return [];

  return [{ seriesId, level, side, value, unit: decodeUnit(unitText) }];
}

function decodeUnit(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return '';
  }
}

export function parseConfiguration(
  options: Record<string, string> | undefined,
  fallback: ChartConfiguration,
): ChartConfiguration {
  if (!options || Object.keys(options).length === 0) return fallback;
  const ids =
    options.sig !== undefined
      ? listOf(options.sig).slice(0, CHART_MAX_SERIES)
      : fallback.series.map((entry) => entry.seriesId);
  const styles = listOf(options.st);
  const hidden = new Set(listOf(options.hid));
  const displayUnits = new Map(
    (options.du ?? '')
      .split(PAIR_SEPARATOR)
      .filter((pair) => pair.includes('='))
      .map(
        (pair) => [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)] as const,
      ),
  );
  const from = numberOf(options.from);
  const to = numberOf(options.to);
  const range = isEnumValue(ChartRange, options.range) ? options.range : fallback.range;
  const hasWindow =
    range === ChartRange.CUSTOM && from !== undefined && to !== undefined && to > from;
  const axes: AxisSetting[] = (options.ax ?? '')
    .split(PAIR_SEPARATOR)
    .filter((entry) => entry.length > 0)
    .flatMap((entry) => {
      const [seriesId, min, max] = entry.split(FIELD_SEPARATOR);
      if (!seriesId) return [];
      const setting: AxisSetting = {
        seriesId,
        mode: AxisScaleMode.MANUAL,
        min: numberOf(min),
        max: numberOf(max),
      };
      return setting.min === undefined && setting.max === undefined ? [] : [setting];
    });
  const thresholds = (options.th ?? '')
    .split(PAIR_SEPARATOR)
    .flatMap((entry) => thresholdOf(entry, ids))
    .slice(0, CHART_MAX_CONFIGURED_THRESHOLDS);
  const overlays =
    options.ov !== undefined
      ? listOf(options.ov).filter((candidate): candidate is ChartOverlay =>
          isEnumValue(ChartOverlay, candidate),
        )
      : fallback.overlays;
  return {
    title:
      options.title !== undefined ? options.title.slice(0, CHART_TITLE_MAX_LENGTH) : fallback.title,
    range: range === ChartRange.CUSTOM && !hasWindow ? fallback.range : range,
    window:
      hasWindow && from !== undefined && to !== undefined ? { start: from, end: to } : undefined,
    mode: isEnumValue(ChartMode, options.mode) ? options.mode : fallback.mode,
    series: ids.map((seriesId, index) => ({
      seriesId,
      isVisible: !hidden.has(seriesId),
      style: styleOf(styles[index], index),
      displayUnit: displayUnits.get(seriesId),
    })),
    axes,
    thresholds,
    shouldShowGridlines: options.grid !== OPTION_OFF,
    shouldShowMinMax: options.mm === OPTION_ON,
    isMarkerMode: options.mk === OPTION_ON,
    markerAt: numberOf(options.at),
    isLive: options.live === OPTION_ON,
    overlays,
    panel: isEnumValue(ChartPanel, options.pn) ? options.pn : undefined,
  };
}
