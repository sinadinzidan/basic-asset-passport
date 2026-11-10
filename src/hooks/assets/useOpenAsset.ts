import { createContext, useContext } from 'react';

import type { AssetIdentifier } from '../../types/asset';

export type OpenAsset = (asset: AssetIdentifier) => void;

/**
 * Opens an asset in the register. It is null where nothing can open one, so
 * a part of the page that offers it, such as the file preview, shows the
 * asset without that action.
 */
export const OpenAssetContext = createContext<OpenAsset | null>(null);

export function useOpenAsset(): OpenAsset | null {
  return useContext(OpenAssetContext);
}
