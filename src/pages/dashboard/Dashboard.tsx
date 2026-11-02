import type { HostAppAPI } from '@cognite/app-sdk';

import { AssetList } from '../../components/assets/AssetList';
import { EquipmentPage } from '../../components/assets/EquipmentPage';
import { AppTopbar } from '../../components/general/AppTopbar';
import { RetryAlert } from '../../components/general/RetryAlert';
import { PassportTab } from '../../enums/passportTab';
import { useAppNavigation } from '../../hooks/navigation/useAppNavigation';
import { useThemeMode } from '../../hooks/theme/useThemeMode';

type DashboardProps = {
  api?: Pick<HostAppAPI, 'syncInternalState'>;
  initialState?: string;
};

export function Dashboard({ api, initialState }: DashboardProps) {
  const { theme, setTheme } = useThemeMode();
  const { state, hasSyncError, ...navigate } = useAppNavigation(api, initialState);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppTopbar assetName={state.selectedAsset?.name} onHome={navigate.goHome} theme={theme} onThemeChange={setTheme} />
      <main className="w-full flex-1 space-y-6 px-4 py-6 md:px-6 md:py-8">
        {hasSyncError && <RetryAlert message="Could not save this view to the shared link." />}
        {state.selectedAsset ? (
          <EquipmentPage
            passportTab={state.passportTab ?? PassportTab.OVERVIEW}
            onPassportTabChange={navigate.setPassportTab}
            selectedEquipmentId={state.selectedEquipmentId}
            onEquipmentSelect={navigate.selectEquipment}
            selectedAsset={state.selectedAsset}
            selectedFile={state.selectedFile}
            onFileSelect={navigate.selectFile}
          />
        ) : (
          <AssetList
            page={state.assetPage ?? 0}
            pageSize={state.assetPageSize}
            view={state.assetView}
            onViewChange={navigate.setView}
            search={state.assetSearch ?? ''}
            onSearchChange={navigate.setSearch}
            onPageSizeChange={navigate.setPageSize}
            onPageChange={navigate.setPage}
            onAssetSelect={navigate.selectAsset}
          />
        )}
      </main>
    </div>
  );
}
