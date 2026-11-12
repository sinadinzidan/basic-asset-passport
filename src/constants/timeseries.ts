import { MODEL } from '../config/model';
import type { TimeseriesPreviewKind } from '../enums/timeseriesPreviewKind';

import { MS_PER_DAY } from './time';

export const TIMESERIES_QUERY_LIMIT = 200;
export const TIMESERIES_QUERY_STALE_TIME_MS = 30_000;

const TREND_WINDOW_DAYS = 180;

export const TREND_WINDOW_MS = TREND_WINDOW_DAYS * MS_PER_DAY;

export const TREND_WINDOW_LABEL = '6 months';
export const TREND_GRANULARITY = '2d';
export const TREND_QUERY_STALE_TIME_MS = 60_000;

export const TREND_REQUEST_CHUNK_SIZE = 50;
export const NUMERIC_TIMESERIES_TYPE = 'numeric';

export const OWE_HIGH_LABEL = 'OWE high';
export const OWE_LOW_LABEL = 'OWE low';
export const DLE_HIGH_LABEL = 'DLE high';
export const DLE_LOW_LABEL = 'DLE low';
export const TRIP_HIGH_LABEL = 'Trip high';
export const TRIP_LOW_LABEL = 'Trip low';

export const TIMESERIES_DISPLAY_PROPERTIES: readonly string[] = [
  'description',
  'tag',
  MODEL.properties.timeseries.unit,
  MODEL.properties.timeseries.type,
  'isStep',
  'plantName',
  'unitName',
  'trainName',
  'equipmentTypeName',
  'typicalvalue',
  'zero',
  'span',
  MODEL.properties.timeseries.oweLimitMin,
  MODEL.properties.timeseries.oweLimitMax,
  MODEL.properties.timeseries.dleLimitMin,
  MODEL.properties.timeseries.dleLimitMax,
  MODEL.properties.timeseries.tripLimitMin,
  MODEL.properties.timeseries.tripLimitMax,
];
export const TIMESERIES_UNIT_PROPERTIES: readonly string[] = [MODEL.properties.timeseries.unit];

export const CHART_MAX_POINTS = 1000;

export const CHART_GRANULARITY_STEPS: readonly string[] = [
  '1m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '6h',
  '12h',
  '1d',
];
export const CHART_NUMERIC_DATA_TYPE = 'Numeric';
export const CHART_SOURCE_NAME = 'CDF time series';
export const CHART_MOCK_SOURCE_NAME = 'Mock time series (generated readings)';
export const CHART_QUERY_LIMIT_FACTOR = 2;

export const CHART_OPEN_WINDOW_MS = TREND_WINDOW_MS;

export const TIMESERIES_LOADING_MESSAGE = 'Loading timeseries...';
export const TIMESERIES_ERROR_TITLE = 'Timeseries could not be loaded';
export const TIMESERIES_ERROR_DESCRIPTION = 'Check access to the Timeseries view, then try again.';
export const TIMESERIES_EMPTY_TITLE = 'No timeseries linked';
export const TIMESERIES_EMPTY_DESCRIPTION =
  'There are no Timeseries instances linked to this asset.';
export const SHOW_MORE_TIMESERIES_LABEL = 'Show more timeseries';
export const TIMESERIES_PREVIEW_LOADING_LABEL = 'Loading preview';
export const TIMESERIES_PREVIEW_MESSAGES: Record<
  | TimeseriesPreviewKind.NON_NUMERIC
  | TimeseriesPreviewKind.EMPTY
  | TimeseriesPreviewKind.UNAVAILABLE,
  string
> = {
  NON_NUMERIC: 'Not a numeric series: there is no trend to draw.',
  EMPTY: `No readings in the last ${TREND_WINDOW_LABEL}.`,
  UNAVAILABLE: 'The preview could not be loaded.',
};
