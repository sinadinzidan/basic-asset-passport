import { createContext, useContext } from 'react';

import type { AssetDataClient } from '../../types/assetDataClient';

export const AssetDataClientContext = createContext<AssetDataClient | null>(
  null,
);

export function useAssetDataClient(): AssetDataClient {
  const client = useContext(AssetDataClientContext);

  if (client === null) {
    throw new Error(
      'useAssetDataClient must be used inside an AssetDataClientContext provider.',
    );
  }

  return client;
}
