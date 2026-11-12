import { MS_PER_DAY } from './time';
export const TIMESERIES_VIEW_EXTERNAL_ID = 'PI_Timeseries';

export const TIMESERIES_ASSETS_PROPERTY = 'assets';
export const TIMESERIES_QUERY_LIMIT = 200;
export const TIMESERIES_QUERY_STALE_TIME_MS = 30_000;

const TREND_WINDOW_DAYS = 180;

export const TREND_WINDOW_MS = TREND_WINDOW_DAYS * MS_PER_DAY;

export const TREND_WINDOW_LABEL = '6 months';
export const TREND_GRANULARITY = '2d';
export const TREND_QUERY_STALE_TIME_MS = 60_000;

export const TREND_REQUEST_CHUNK_SIZE = 50;
export const NUMERIC_TIMESERIES_TYPE = 'numeric';
export const TIMESERIES_TYPE_PROPERTY = 'type';

export const TIMESERIES_DISPLAY_PROPERTIES: readonly string[] = [
  'description',
  'tag',
  'engunits',
  'type',
  'isStep',
  'plantName',
  'unitName',
  'trainName',
  'equipmentTypeName',
  'typicalvalue',
  'zero',
  'span',
  'oweLimitMin',
  'oweLimitMax',
  'dleLimitMin',
  'dleLimitMax',
  'tripLimitMin',
  'tripLimitMax',
];
export const TIMESERIES_UNIT_PROPERTIES: readonly string[] = ['engunits'];

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
export const CHART_SOURCE_NAME = 'CDF time series';
export const CHART_MOCK_SOURCE_NAME = 'Mock time series (generated readings)';
export const CHART_QUERY_LIMIT_FACTOR = 2;

export const CHART_OPEN_WINDOW_MS = TREND_WINDOW_MS;
