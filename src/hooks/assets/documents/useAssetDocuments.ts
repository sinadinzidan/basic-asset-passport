import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { DOCUMENT_QUERY_LIMIT, DOCUMENT_QUERY_STALE_TIME_MS } from '../../../constants/documents';
import { getDocumentRefetchInterval } from '../../../lib/documentPolling';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import { listAssetDocuments } from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { listAssetDocuments };

export type UseAssetDocumentsContextType = typeof defaultDeps;
export const UseAssetDocumentsContext = createContext<UseAssetDocumentsContextType>(defaultDeps);

export function getAssetDocumentsQueryKey(project: string, assetIdentifier: AssetIdentifier) {
  return [
    'asset-documents',
    project,
    MODEL.space,
    MODEL.externalId,
    MODEL.version,
    MODEL.views.document,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetDocuments(
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
) {
  const { listAssetDocuments: loadDocuments } = useContext(UseAssetDocumentsContext);
  const client = useAssetContext();

  const listKey = getAssetDocumentsQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => loadDocuments(client, assetIdentifier, limit),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    refetchInterval: (query) => getDocumentRefetchInterval(query.state.data?.items),
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
