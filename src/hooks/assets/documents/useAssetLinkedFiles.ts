import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  DOCUMENT_QUERY_STALE_TIME_MS,
  FILES_VIEW_EXTERNAL_ID,
} from '../../../constants/documents';
import { listAssetLinkedFiles } from '../../../services/assets/documents/assetDocumentService';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetDataClient } from '../useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssetLinkedFiles };

export type UseAssetLinkedFilesContextType = typeof defaultDeps;
export const UseAssetLinkedFilesContext =
  createContext<UseAssetLinkedFilesContextType>(defaultDeps);

export function getAssetLinkedFilesQueryKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return [
    'asset-linked-files',
    project,
    ASSET_PASSPORT_MODEL_SPACE,
    ASSET_PASSPORT_MODEL_EXTERNAL_ID,
    ASSET_PASSPORT_MODEL_VERSION,
    FILES_VIEW_EXTERNAL_ID,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

/** The files that already exist in the domain model for the asset. Read separately from the documents uploaded here, so a failure to read them never hides those. */
export function useAssetLinkedFiles(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, listAssetLinkedFiles: loadFiles } =
    useContext(UseAssetLinkedFilesContext);
  const client = useClient();

  return useQuery({
    queryKey: getAssetLinkedFilesQueryKey(client.project, assetIdentifier),
    queryFn: () => loadFiles(client, assetIdentifier),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
  });
}
