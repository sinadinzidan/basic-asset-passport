import { AssetTable, SelectedAssetBreadcrumb } from '../../components/assets';
import { AppTopbar } from '../../components/general';
import { useNavigationState } from '../../hooks/general/useNavigationState';

import { AssetDetails } from './AssetDetails';

export function Assets() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  return (
    <>
      <AppTopbar breadcrumb={selectedAsset ? <SelectedAssetBreadcrumb /> : null} />
      {selectedAsset ? <AssetDetails /> : <AssetTable />}
    </>
  );
}
