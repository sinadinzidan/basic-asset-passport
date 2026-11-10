import { AssetTable } from '../../components/assets/AssetTable';
import { AssetTopbar } from '../../components/assets/AssetTopbar';
import { TimeseriesChartStateContext } from '../../hooks/assets/timeseries/useTimeseriesChartState';
import { useAssetNavigation } from '../../hooks/assets/useAssetNavigation';
import { OpenAssetContext } from '../../hooks/assets/useOpenAsset';
import type { StateSyncApi } from '../../types/host';

import { AssetEquipmentRegister } from './AssetEquipmentRegister';

type AssetRegisterProps = {
  api: StateSyncApi | null;
  initialState?: string;
};

export function AssetRegister({ api, initialState }: AssetRegisterProps) {
  const {
    navigationState,
    changeSearchQuery,
    selectAsset,
    clearSelectedAsset,
    changeEquipmentTab,
    changeTimeseriesChart,
  } = useAssetNavigation(api, initialState);

  if (navigationState.selectedAsset) {
    return (
      <OpenAssetContext.Provider value={selectAsset}>
        <AssetTopbar selectedAsset={navigationState.selectedAsset} />
        <TimeseriesChartStateContext.Provider
          value={{
            options: navigationState.timeseriesChart ?? null,
            onChange: changeTimeseriesChart,
          }}
        >
          <AssetEquipmentRegister
            assetIdentifier={navigationState.selectedAsset}
            activeTab={navigationState.activeEquipmentTab}
            onTabChange={changeEquipmentTab}
            onBack={clearSelectedAsset}
          />
        </TimeseriesChartStateContext.Provider>
      </OpenAssetContext.Provider>
    );
  }

  return (
    <>
      <AssetTopbar />
      <AssetTable
        onAssetSelect={selectAsset}
        searchQuery={navigationState.searchQuery ?? ''}
        onSearchChange={changeSearchQuery}
      />
    </>
  );
}
