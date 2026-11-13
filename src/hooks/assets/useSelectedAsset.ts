import type { AssetIdentifier } from '../../types/asset';
import { useNavigationState } from '../general/useNavigationState';

export function useSelectedAsset(): AssetIdentifier {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  if (selectedAsset === null || selectedAsset === undefined) {
    throw new Error('useSelectedAsset must be used while an asset is open.');
  }

  return selectedAsset;
}
