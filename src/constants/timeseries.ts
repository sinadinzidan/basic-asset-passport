export const TIMESERIES_VIEW_EXTERNAL_ID = 'PI_Timeseries';
/** The direct relation list that links a time series to its assets. */
export const TIMESERIES_ASSETS_PROPERTY = 'assets';
export const TIMESERIES_QUERY_LIMIT = 200;
export const TIMESERIES_QUERY_STALE_TIME_MS = 30_000;

const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * The preview shows the last six months, one average per two days: about 90 points a series, within the
 * API's default of 100 per series, and 50 series per request stay within its cap on points per answer.
 */
export const TREND_WINDOW_MS = 180 * DAY_MS;
export const TREND_GRANULARITY = '2d';
export const TREND_QUERY_STALE_TIME_MS = 60_000;
/** Series per datapoints request; the API takes at most 100 and caps the points in one answer. */
export const TREND_REQUEST_CHUNK_SIZE = 50;
export const NUMERIC_TIMESERIES_TYPE = 'numeric';
export const TIMESERIES_TYPE_PROPERTY = 'type';
/**
 * The properties a series card shows, in order. A PI_Timeseries carries around
 * fifty PI point settings (compression, exception, scan...) that mean nothing
 * to someone reading an asset, so the card shows only these. The name is the
 * card's title.
 */
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

/** The chart asks for at most this many averages per series, so any window stays quick to draw. */
export const CHART_MAX_POINTS = 1000;
/** The averaging steps the chart may use, finest first, in the API's granularity notation. */
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
/** The chart opens on the last six months, the same span as the card previews. */
export const CHART_OPEN_WINDOW_MS = 180 * DAY_MS;
