import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { MODEL } from '../../../config/model';
import { DOCUMENT_QUERY_LIMIT, DOCUMENT_QUERY_STALE_TIME_MS } from '../../../constants/documents';
import { isKeyOfList } from '../../../lib/queryKeys';
import { toQueryState } from '../../../lib/queryState';
import { listAssetLinkedFiles } from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

const defaultDeps = { listAssetLinkedFiles };

export type UseAssetLinkedFilesContextType = typeof defaultDeps;
export const UseAssetLinkedFilesContext =
  createContext<UseAssetLinkedFilesContextType>(defaultDeps);

export function getAssetLinkedFilesQueryKey(project: string, assetIdentifier: AssetIdentifier) {
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

export function useAssetLinkedFiles(
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
) {
  const { listAssetLinkedFiles: loadFiles } = useContext(UseAssetLinkedFilesContext);
  const client = useAssetContext();

  const listKey = getAssetLinkedFilesQueryKey(client.project, assetIdentifier);

  const query = useQuery({
    queryKey: [...listKey, limit],
    queryFn: () => loadFiles(client, assetIdentifier, limit),
    staleTime: DOCUMENT_QUERY_STALE_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      isKeyOfList(previousQuery?.queryKey, listKey) ? previousData : undefined,
  });

  return toQueryState(query);
}
