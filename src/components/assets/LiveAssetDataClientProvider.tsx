import { useCogniteSdk } from '@cognite/app-sdk/react';
import type { ReactNode } from 'react';

import { AssetDataClientContext } from '../../hooks/assets/useAssetDataClient';

type LiveAssetDataClientProviderProps = {
  children: ReactNode;
};

/** Provides the authenticated Flows SDK client to the asset hooks. */
export function LiveAssetDataClientProvider({
  children,
}: LiveAssetDataClientProviderProps) {
  const client = useCogniteSdk();

  return (
    <AssetDataClientContext.Provider value={client}>
      {children}
    </AssetDataClientContext.Provider>
  );
}
