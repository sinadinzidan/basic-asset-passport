import type { TimeseriesPreviewKind } from '../enums/timeseriesPreviewKind';

import type { AssetInstanceDetails } from './asset';

export type TimeseriesIdentifier = Pick<AssetInstanceDetails, 'space' | 'externalId'>;

export type TimeseriesPoint = { timestamp: number; value: number };

export type TimeseriesTrend = TimeseriesIdentifier & { points: TimeseriesPoint[] };

export type TimeseriesTrendWindow = {
  from: number;
  to: number;
  granularity: string;
  limit?: number;
};

export type TimeseriesTrendOptions = {
  isStrict?: boolean;
};

export type TimeseriesContextType = {
  project: string;
  isSimulated?: boolean;
  getTrends: (
    identifiers: TimeseriesIdentifier[],
    window: TimeseriesTrendWindow,
    options?: TimeseriesTrendOptions,
  ) => Promise<TimeseriesTrend[]>;
};

export type TimeseriesPreview =
  | { kind: TimeseriesPreviewKind.LOADING }
  | { kind: TimeseriesPreviewKind.READY; points: TimeseriesPoint[] }
  | { kind: TimeseriesPreviewKind.EMPTY }
  | { kind: TimeseriesPreviewKind.NON_NUMERIC }
  | { kind: TimeseriesPreviewKind.UNAVAILABLE };
