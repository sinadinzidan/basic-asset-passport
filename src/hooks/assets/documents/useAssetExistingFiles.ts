import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { DOCUMENT_QUERY_LIMIT, DOCUMENT_QUERY_STALE_TIME_MS } from '../../../constants/documents';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import {
  createAssetDocumentService,
  type AssetDocumentService,
} from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import { useAssetClient } from '../useAssetClient';

const defaultDeps: {
  createAssetDocumentService: (
    client: AssetContextType,
  ) => Pick<AssetDocumentService, 'listAssetLinkedFiles'>;
} = { createAssetDocumentService };

export type UseAssetExistingFilesContextType = typeof defaultDeps;
export const UseAssetExistingFilesContext =
  createContext<UseAssetExistingFilesContextType>(defaultDeps);

export function getAssetExistingFilesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
  return [
    'asset-linked-files',
    project,
    MODEL.space,
    MODEL.externalId,
    MODEL.version,
    MODEL.filesView.externalId,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

export function useAssetExistingFiles(
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
) {
  const { createAssetDocumentService } = useContext(UseAssetExistingFilesContext);
  const client = useAssetClient();
  const documentService = createAssetDocumentService(client);

  const listKey = getAssetExistingFilesQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => documentService.listAssetLinkedFiles(assetIdentifier, limit),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
