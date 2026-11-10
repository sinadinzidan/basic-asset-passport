import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  DOCUMENT_QUERY_STALE_TIME_MS,
  DOCUMENT_VIEW_EXTERNAL_ID,
} from '../../../constants/documents';
import { getDocumentRefetchInterval } from '../../../lib/documentPolling';
import { listAssetDocuments } from '../../../services/assets/documents/assetDocumentService';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetDataClient } from '../useAssetDataClient';

const defaultDeps = { useAssetDataClient, listAssetDocuments };

export type UseAssetDocumentsContextType = typeof defaultDeps;
export const UseAssetDocumentsContext =
  createContext<UseAssetDocumentsContextType>(defaultDeps);

export function getAssetDocumentsQueryKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return [
    'asset-documents',
    project,
    ASSET_PASSPORT_MODEL_SPACE,
    ASSET_PASSPORT_MODEL_EXTERNAL_ID,
    ASSET_PASSPORT_MODEL_VERSION,
    DOCUMENT_VIEW_EXTERNAL_ID,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetDocuments(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, listAssetDocuments: loadDocuments } =
    useContext(UseAssetDocumentsContext);
  const client = useClient();

  return useQuery({
    queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
    queryFn: () => loadDocuments(client, assetIdentifier),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    refetchInterval: (query) => getDocumentRefetchInterval(query.state.data),
  });
}
