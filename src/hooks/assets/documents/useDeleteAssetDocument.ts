import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import {
  createAssetDocumentService,
  type AssetDocumentService,
} from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { DocumentIdentifier } from '../../../types/document';
import { useAssetContext } from '../useAssetContext';

import { getAssetDocumentsQueryKey } from './useAssetDocuments';

const defaultDeps: {
  createAssetDocumentService: (
    client: AssetContextType,
  ) => Pick<AssetDocumentService, 'deleteAssetDocument'>;
} = { createAssetDocumentService };

export type UseDeleteAssetDocumentContextType = typeof defaultDeps;
export const UseDeleteAssetDocumentContext =
  createContext<UseDeleteAssetDocumentContextType>(defaultDeps);

export function useDeleteAssetDocument(assetIdentifier: AssetIdentifier) {
  const { createAssetDocumentService } = useContext(UseDeleteAssetDocumentContext);
  const client = useAssetContext();
  const queryClient = useQueryClient();
  const documentService = createAssetDocumentService(client);

  const mutation = useMutation({
    mutationFn: (document: DocumentIdentifier) => documentService.deleteAssetDocument(document),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
      }),
  });

  return {
    deleteDocument: mutation.mutateAsync,
    deletingDocument: mutation.isPending ? mutation.variables : null,
    error: mutation.error,
  };
}
