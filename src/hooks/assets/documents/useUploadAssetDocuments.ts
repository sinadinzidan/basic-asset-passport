import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { formatDocumentsUploadedMessage } from '../../../lib/documentUploadMessage';
import { uploadAssetDocument } from '../../../services/assets/documents/assetDocumentService';
import type { AssetIdentifier } from '../../../types/asset';
import type { DocumentUploadResult } from '../../../types/document';
import { useSuccessToast } from '../../general/useSuccessToast';
import { useAssetDataClient } from '../useAssetDataClient';

import { getAssetDocumentsQueryKey } from './useAssetDocuments';
import { useDocumentFileClient } from './useDocumentFileClient';

const defaultDeps = {
  useAssetDataClient,
  useDocumentFileClient,
  useSuccessToast,
  uploadAssetDocument,
};

export type UseUploadAssetDocumentsContextType = typeof defaultDeps;
export const UseUploadAssetDocumentsContext =
  createContext<UseUploadAssetDocumentsContextType>(defaultDeps);

export function getUploadAssetDocumentsMutationKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return [
    'upload-asset-documents',
    project,
    assetIdentifier.space,
    assetIdentifier.externalId,
  ];
}

/**
 * Uploads the files side by side. One failing file does not stop the others:
 * every file gets a result, and the list refreshes whatever the outcome. Files
 * that uploaded are confirmed in a toast; failures stay for the caller to show.
 */
export function useUploadAssetDocuments(assetIdentifier: AssetIdentifier) {
  const {
    useAssetDataClient: useClient,
    useDocumentFileClient: useFileClient,
    useSuccessToast: useToast,
    uploadAssetDocument: uploadDocument,
  } = useContext(UseUploadAssetDocumentsContext);
  const client = useClient();
  const fileClient = useFileClient();
  const showSuccessToast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: getUploadAssetDocumentsMutationKey(
      client.project,
      assetIdentifier,
    ),
    mutationFn: (files: File[]): Promise<DocumentUploadResult[]> =>
      Promise.all(
        files.map(async (file): Promise<DocumentUploadResult> => {
          try {
            await uploadDocument(client, fileClient, assetIdentifier, file);
            return { fileName: file.name, errorMessage: null };
          } catch (error) {
            return {
              fileName: file.name,
              errorMessage:
                error instanceof Error ? error.message : 'Upload failed.',
            };
          }
        }),
      ),
    onSuccess: (results) => {
      const uploadedCount = results.filter(
        (result) => result.errorMessage === null,
      ).length;
      if (uploadedCount > 0) {
        showSuccessToast(formatDocumentsUploadedMessage(uploadedCount));
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
      }),
  });
}
