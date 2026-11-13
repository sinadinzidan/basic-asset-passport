import { AssetTable, AssetTopbar } from '../../components/assets';
import { useNavigationState } from '../../hooks/general/useNavigationState';

import { AssetDetails } from './AssetDetails';

export function Assets() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  return (
    <>
      <AssetTopbar />
      {selectedAsset ? <AssetDetails /> : <AssetTable />}
    </>
  );
}
