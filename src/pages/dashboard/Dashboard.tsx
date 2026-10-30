import type { HostAppAPI } from '@cognite/app-sdk';
import { useState } from 'react';

import { AssetList } from '../../components/assets/AssetList';
import { EquipmentPage } from '../../components/assets/EquipmentPage';
import { AppTopbar } from '../../components/general/AppTopbar';
import { RetryAlert } from '../../components/general/RetryAlert';
import { ASSET_PAGE_SIZE } from '../../constants/assets';
import { AssetView } from '../../enums/assetView';
import { PassportTab } from '../../enums/passportTab';
import { useThemeMode } from '../../hooks/theme/useThemeMode';
import type { AppState } from '../../lib/appState';
import { parseInitialState, serializeAppState } from '../../lib/appState';
import type { AssetSelection, FileSelection } from '../../types/asset';

type DashboardProps = {
  api?: Pick<HostAppAPI, 'syncInternalState'>;
  initialState?: string;
};

export function Dashboard({ api, initialState }: DashboardProps) {
  const { theme, setTheme } = useThemeMode();

  const [state, setState] = useState(() => parseInitialState(initialState));
  const [hasSyncError, setHasSyncError] = useState(false);

  async function handleNavigate(nextState: AppState) {
    setState(nextState);
    setHasSyncError(false);
    if (!api) return;

    try {
      setHasSyncError(!(await api.syncInternalState(serializeAppState(nextState))));
    } catch {
      setHasSyncError(true);
    }
  }

  const syncAlert = hasSyncError && (
    <RetryAlert message="Could not save this view to the shared link." />
  );

  const goHome = () => {
    const { selectedAsset: _asset, selectedFile: _file, selectedEquipmentId: _equipment, passportTab: _tab, ...rest } = state;
    void handleNavigate(rest);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppTopbar assetName={state.selectedAsset?.name} onHome={goHome} theme={theme} onThemeChange={setTheme} />
      <main className="w-full flex-1 space-y-6 px-4 py-6 md:px-6 md:py-8">
        {syncAlert}
        {state.selectedAsset ? (
          <EquipmentPage
            passportTab={state.passportTab ?? PassportTab.OVERVIEW}
            onPassportTabChange={(passportTab) => void handleNavigate({ ...state, passportTab })}
            selectedEquipmentId={state.selectedEquipmentId}
            onEquipmentSelect={(selectedEquipmentId) => void handleNavigate({ ...state, selectedEquipmentId })}
            selectedAsset={state.selectedAsset}
            selectedFile={state.selectedFile}
            onFileSelect={(selectedFile: FileSelection | undefined) => {
              const { selectedFile: _previousFile, ...rest } = state;
              void handleNavigate(selectedFile ? { ...rest, selectedFile } : rest);
            }}
          />
        ) : (
          <AssetList
            page={state.assetPage ?? 0}
            pageSize={state.assetPageSize}
            view={state.assetView}
            onViewChange={(view) => {
              const { assetView: _previousView, ...rest } = state;
              void handleNavigate(view === AssetView.GRID ? { ...rest, assetView: AssetView.GRID } : rest);
            }}
            search={state.assetSearch ?? ''}
            onSearchChange={(assetSearch: string) => void handleNavigate({
              ...(state.assetPageSize ? { assetPageSize: state.assetPageSize } : {}),
              ...(state.assetView ? { assetView: state.assetView } : {}),
              ...(assetSearch ? { assetSearch } : {}),
            })}
            onPageSizeChange={(assetPageSize: number) => {
              const { assetPage: _previousPage, assetPageSize: _previousSize, ...rest } = state;
              void handleNavigate(assetPageSize === ASSET_PAGE_SIZE ? rest : { ...rest, assetPageSize });
            }}
            onPageChange={(assetPage) => {
              const { assetPage: _previousPage, ...rest } = state;
              void handleNavigate(assetPage > 0 ? { ...rest, assetPage } : rest);
            }}
            onAssetSelect={(asset: AssetSelection) => void handleNavigate({ ...state, selectedAsset: asset })}
          />
        )}
      </main>
    </div>
  );
}
