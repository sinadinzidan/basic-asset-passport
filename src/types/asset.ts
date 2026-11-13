import type { LimitedList } from './list';
import type { PropertyDisplay } from './property';

export type AssetListItem = {
  space: string;
  externalId: string;
  name: string | null;
  description: string | null;
  plantName: string | null;
  flocStatus: string | null;
  abcIndicatorName: string | null;
};

export type AssetIdentifier = Pick<AssetListItem, 'space' | 'externalId'>;

export type TimeseriesChartOptions = Record<string, string>;

export type AssetInstanceDetails = {
  space: string;
  externalId: string;
  properties: PropertyDisplay[];
};

export type AssetPage = LimitedList<AssetListItem> & {
  nextCursor: string | null;
};
