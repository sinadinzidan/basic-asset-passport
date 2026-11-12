import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import {
  DOCUMENT_QUERY_LIMIT,
  DOCUMENT_QUERY_STALE_TIME_MS,
  DOCUMENT_VIEW_EXTERNAL_ID,
} from '../../../constants/documents';
import { getDocumentRefetchInterval } from '../../../lib/documentPolling';
import { isKeyOfList } from '../../../lib/queryKeys';
import {
  createAssetDocumentService,
  type AssetDocumentService,
} from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import { useAssetContext } from '../useAssetContext';

const defaultDeps: {
  createAssetDocumentService: (
    client: AssetContextType,
  ) => Pick<AssetDocumentService, 'listAssetDocuments'>;
} = { createAssetDocumentService };

export type UseAssetDocumentsContextType = typeof defaultDeps;
export const UseAssetDocumentsContext = createContext<UseAssetDocumentsContextType>(defaultDeps);

export function getAssetDocumentsQueryKey(project: string, assetIdentifier: AssetIdentifier) {
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

export function useAssetDocuments(
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
) {
  const { createAssetDocumentService } = useContext(UseAssetDocumentsContext);
  const client = useAssetContext();
  const documentService = createAssetDocumentService(client);

  const listKey = getAssetDocumentsQueryKey(client.project, assetIdentifier);

  return useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => documentService.listAssetDocuments(assetIdentifier, limit),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    refetchInterval: (query) => getDocumentRefetchInterval(query.state.data?.items),
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });
}
