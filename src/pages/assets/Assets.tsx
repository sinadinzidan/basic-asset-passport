import { AppViewTabs, AssetTable, SelectedAssetBreadcrumb } from '../../components/assets';
import { ThreeDView } from '../../components/assets/three-d/ThreeDView';
import { AppTopbar } from '../../components/general';
import { AppView } from '../../enums/appView';
import { useNavigationState } from '../../hooks/general/useNavigationState';

import { AssetDetails } from './AssetDetails';

export function Assets() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);
  const activeView =
    useNavigationState((store) => store.navigationState.activeView) ?? AppView.ASSETS;

  if (activeView === AppView.THREE_D) {
    return (
      <>
        <AppTopbar />
        <AppViewTabs />
        <ThreeDView />
      </>
    );
  }

  return (
    <>
      <AppTopbar breadcrumb={selectedAsset ? <SelectedAssetBreadcrumb /> : null} />
      <AppViewTabs />
      {selectedAsset ? <AssetDetails /> : <AssetTable />}
    </>
  );
}
