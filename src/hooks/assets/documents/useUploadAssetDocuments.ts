import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { DOCUMENT_UPLOAD_FAILED_MESSAGE } from '../../../constants/documents';
import { formatDocumentsUploadedMessage } from '../../../lib/documentUploadMessage';
import { uploadAssetDocument } from '../../../services/assets/documents/assetDocument';
import type { AssetIdentifier } from '../../../types/asset';
import type { DocumentUploadResult } from '../../../types/document';
import { useSuccessToast } from '../../general/useSuccessToast';
import { useAssetContext } from '../useAssetContext';

import { getAssetDocumentsQueryKey } from './useAssetDocuments';
import { useDocumentFileContext } from './useDocumentFileContext';

const defaultDeps = {
  useSuccessToast,
  uploadAssetDocument,
};

const NO_RESULTS: DocumentUploadResult[] = [];
const NO_FILES: File[] = [];

export type UseUploadAssetDocumentsContextType = typeof defaultDeps;
export const UseUploadAssetDocumentsContext =
  createContext<UseUploadAssetDocumentsContextType>(defaultDeps);

export function getUploadAssetDocumentsMutationKey(
  project: string,
  assetIdentifier: AssetIdentifier,
) {
  return ['upload-asset-documents', project, assetIdentifier.space, assetIdentifier.externalId];
}

export function useUploadAssetDocuments(assetIdentifier: AssetIdentifier) {
  const { useSuccessToast: useToast, uploadAssetDocument: uploadDocument } = useContext(
    UseUploadAssetDocumentsContext,
  );
  const client = useAssetContext();
  const fileClient = useDocumentFileContext();
  const showSuccessToast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: getUploadAssetDocumentsMutationKey(client.project, assetIdentifier),
    mutationFn: (files: File[]): Promise<DocumentUploadResult[]> =>
      Promise.all(
        files.map(async (file): Promise<DocumentUploadResult> => {
          try {
            await uploadDocument(client, fileClient, assetIdentifier, file);
            return { fileName: file.name, errorMessage: null };
          } catch (error) {
            return {
              fileName: file.name,
              errorMessage: error instanceof Error ? error.message : DOCUMENT_UPLOAD_FAILED_MESSAGE,
            };
          }
        }),
      ),
    onSuccess: (results) => {
      const uploadedCount = results.filter((result) => result.errorMessage === null).length;
      if (uploadedCount > 0) {
        showSuccessToast(formatDocumentsUploadedMessage(uploadedCount));
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetDocumentsQueryKey(client.project, assetIdentifier),
      }),
  });

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    results: mutation.data ?? NO_RESULTS,
    uploadedFiles: mutation.variables ?? NO_FILES,
  };
}
