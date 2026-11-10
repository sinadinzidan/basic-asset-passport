import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { deleteAssetDocument } from '../../../services/assets/documents/assetDocumentService';
import type { AssetIdentifier } from '../../../types/asset';
import type { DocumentIdentifier } from '../../../types/document';
import { useAssetDataClient } from '../useAssetDataClient';

import { getAssetDocumentsQueryKey } from './useAssetDocuments';

const defaultDeps = { useAssetDataClient, deleteAssetDocument };

export type UseDeleteAssetDocumentContextType = typeof defaultDeps;
export const UseDeleteAssetDocumentContext =
  createContext<UseDeleteAssetDocumentContextType>(defaultDeps);

export function useDeleteAssetDocument(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, deleteAssetDocument: deleteDocument } =
    useContext(UseDeleteAssetDocumentContext);
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: DocumentIdentifier) =>
      deleteDocument(client, document),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
      }),
  });
}
