import type { AssetEquipmentTab } from '../enums/assetEquipmentTab';

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

/** The chart's setup as the flat string record the trend chart serialises it to. */
export type TimeseriesChartOptions = Record<string, string>;

export type AssetNavigationState = {
  selectedAsset: AssetIdentifier | null;
  activeEquipmentTab: AssetEquipmentTab;
  /** The text the asset register is searched for; absent while there is no search. */
  searchQuery?: string;
  /** The open timeseries chart; absent while the chart is closed. */
  timeseriesChart?: TimeseriesChartOptions;
};

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

export type AssetEquipmentDetails = {
  asset: AssetInstanceDetails;
  equipment: AssetInstanceDetails[];
};

export type AssetPage = {
  items: AssetListItem[];
  nextCursor: string | null;
};
