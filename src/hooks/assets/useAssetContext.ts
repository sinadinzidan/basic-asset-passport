import { createContext, useContext } from 'react';

import type { AssetContextType } from '../../types/assetContext';

export const AssetContext = createContext<AssetContextType | null>(null);

export function useAssetContext(): AssetContextType {
  const client = useContext(AssetContext);

  if (client === null) {
    throw new Error('useAssetContext must be used inside an AssetContext provider.');
  }

  return client;
}
