import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { deleteAssetDocument } from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { DocumentIdentifier } from '../../../types/document';
import { useAssetContext } from '../useAssetContext';

import { getAssetDocumentsQueryKey } from './useAssetDocuments';

const defaultDeps = { deleteAssetDocument };

export type UseDeleteAssetDocumentContextType = typeof defaultDeps;
export const UseDeleteAssetDocumentContext =
  createContext<UseDeleteAssetDocumentContextType>(defaultDeps);

export function useDeleteAssetDocument(assetIdentifier: AssetIdentifier) {
  const { deleteAssetDocument: deleteDocument } = useContext(UseDeleteAssetDocumentContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (document: DocumentIdentifier) => deleteDocument(client, document),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
      }),
  });
}
