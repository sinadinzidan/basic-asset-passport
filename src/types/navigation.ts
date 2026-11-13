import type { AssetTab } from '../enums/assetTab';

import type { AssetIdentifier, TimeseriesChartOptions } from './asset';

export type NavigationState = {
  selectedAsset: AssetIdentifier | null;
  activeAssetTab: AssetTab;
  searchQuery?: string;
  timeseriesChart?: TimeseriesChartOptions;
  assetTableCursors?: string[];
  isAssistantOpen?: boolean;
};

type NavigationActions = {
  changeSearchQuery: (searchQuery: string) => void;
  goToNextAssetTablePage: (nextCursor: string) => void;
  goToPreviousAssetTablePage: () => void;
  goToFirstAssetTablePage: () => void;
  selectAsset: (assetIdentifier: AssetIdentifier) => void;
  clearSelectedAsset: () => void;
  changeAssetTab: (activeAssetTab: AssetTab) => void;
  changeTimeseriesChart: (timeseriesChart: TimeseriesChartOptions | null) => void;
  changeAssistantOpen: (isOpen: boolean) => void;
};

export type NavigationStore = {
  navigationState: NavigationState;
  actions: NavigationActions;
};
