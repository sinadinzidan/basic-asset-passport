import { AssetTable } from '../../components/assets/AssetTable';
import { AssetTopbar } from '../../components/assets/AssetTopbar';
import { useNavigationState } from '../../hooks/general/useNavigationState';

import { AssetDetails } from './AssetDetails';

export function Assets() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  return (
    <>
      <AssetTopbar />
      {selectedAsset ? <AssetDetails assetIdentifier={selectedAsset} /> : <AssetTable />}
    </>
  );
}
