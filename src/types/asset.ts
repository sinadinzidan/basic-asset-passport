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

export type AssetPropertyDisplay = {
  identifier: string;
  label: string;
  value: string;
};

export type AssetInstanceDetails = {
  space: string;
  externalId: string;
  properties: AssetPropertyDisplay[];
};

export type AssetPage = {
  items: AssetListItem[];
  nextCursor: string | null;
};
