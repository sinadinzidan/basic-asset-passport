import { createContext, useContext } from 'react';

import type { AssetContextType } from '../../types/assetContext';

export const AssetClientContext = createContext<AssetContextType | null>(null);

export function useAssetClient(): AssetContextType {
  const client = useContext(AssetClientContext);

  if (client === null) {
    throw new Error('useAssetClient must be used inside an AssetClientContext provider.');
  }

  return client;
}
