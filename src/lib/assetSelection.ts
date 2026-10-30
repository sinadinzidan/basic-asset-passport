import type { AssetRecord, AssetSelection } from '../types/asset';

export function toAssetSelection(asset: AssetRecord): AssetSelection | undefined {
  return asset.space && asset.externalId ? { space: asset.space, externalId: asset.externalId, name: asset.name } : undefined;
}
