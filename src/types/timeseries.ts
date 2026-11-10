import type { AssetInstanceDetails } from './asset';

export type TimeseriesIdentifier = Pick<AssetInstanceDetails, 'space' | 'externalId'>;

/** One averaged reading: milliseconds since the epoch and the value. */
export type TimeseriesPoint = { timestamp: number; value: number };

/** The recent readings of one time series, oldest first. */
export type TimeseriesTrend = TimeseriesIdentifier & { points: TimeseriesPoint[] };

/** The time range and resolution of a trend. */
export type TimeseriesTrendWindow = {
  from: number;
  to: number;
  granularity: string;
  /** Most averages returned per series; the API's own default (100) applies when unset. */
  limit?: number;
};

/** How a trend is read. */
export type TimeseriesTrendOptions = {
  /** Reject when any request fails, instead of leaving its series out. */
  isStrict?: boolean;
};

/**
 * Reads the recent, averaged datapoints of time series. The live
 * implementation adapts the datapoints API; mock mode supplies dummy data. By
 * default a series it cannot read is left out of the result rather than
 * failing the rest, which suits a preview. A caller that must show the failure,
 * such as the chart, asks to be strict and gets a rejection instead.
 */
export type TimeseriesDatapointsClient = {
  project: string;
  /** True when the readings are generated, so the chart can say so. */
  isSimulated?: boolean;
  getTrends: (
    identifiers: TimeseriesIdentifier[],
    window: TimeseriesTrendWindow,
    options?: TimeseriesTrendOptions,
  ) => Promise<TimeseriesTrend[]>;
};

/** What a series' preview shows: a drawing of its readings, or why there is none. */
export type TimeseriesPreview =
  | { kind: 'LOADING' }
  | { kind: 'READY'; points: TimeseriesPoint[] }
  | { kind: 'EMPTY' }
  | { kind: 'NON_NUMERIC' }
  | { kind: 'UNAVAILABLE' };
