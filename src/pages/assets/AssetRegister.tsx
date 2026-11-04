import { AssetTable } from '../../components/assets/AssetTable';
import { AssetTopbar } from '../../components/assets/AssetTopbar';
import { useAssetNavigation } from '../../hooks/assets/useAssetNavigation';
import { useThemePreference } from '../../hooks/theme/useThemePreference';
import type { StateSyncApi } from '../../types/host';

import { AssetEquipmentRegister } from './AssetEquipmentRegister';

type AssetRegisterProps = {
  api: StateSyncApi | null;
  initialState?: string;
};

export function AssetRegister({ api, initialState }: AssetRegisterProps) {
  const {
    navigationState,
    selectAsset,
    clearSelectedAsset,
    changeEquipmentTab,
  } = useAssetNavigation(api, initialState);
  const { theme, setTheme } = useThemePreference();

  if (navigationState.selectedAsset) {
    return (
      <>
        <AssetTopbar
          selectedAsset={navigationState.selectedAsset}
          theme={theme}
          onThemeChange={setTheme}
        />
        <AssetEquipmentRegister
          assetIdentifier={navigationState.selectedAsset}
          activeTab={navigationState.activeEquipmentTab}
          onTabChange={changeEquipmentTab}
          onBack={clearSelectedAsset}
        />
      </>
    );
  }

  return (
    <>
      <AssetTopbar theme={theme} onThemeChange={setTheme} />
      <AssetTable onAssetSelect={selectAsset} />
    </>
  );
}
