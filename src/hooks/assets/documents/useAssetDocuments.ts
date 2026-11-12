import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { DOCUMENT_QUERY_LIMIT, DOCUMENT_QUERY_STALE_TIME_MS } from '../../../constants/documents';
import { getDocumentRefetchInterval } from '../../../lib/documentPolling';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import {
  createAssetDocumentService,
  type AssetDocumentService,
} from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import { useClock } from '../../general/useClock';
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
  const { createAssetDocumentService } = useContext(UseAssetDocumentsContext);
  const now = useClock();
  const client = useAssetContext();
  const documentService = createAssetDocumentService(client);

  const listKey = getAssetDocumentsQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => documentService.listAssetDocuments(assetIdentifier, limit),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    refetchInterval: (query) => getDocumentRefetchInterval(query.state.data?.items, now()),
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
