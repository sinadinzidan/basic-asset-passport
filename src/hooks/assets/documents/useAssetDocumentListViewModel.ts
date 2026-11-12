import { DOCUMENT_QUERY_LIMIT } from '../../../constants/documents';
import { isSameInstance } from '../../../lib/instanceKey';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetDocument } from '../../../types/document';
import { useListLimit } from '../../general/useListLimit';

import { useAssetDocuments } from './useAssetDocuments';
import { useAssetLinkedFiles } from './useAssetLinkedFiles';
import { useDeleteAssetDocument } from './useDeleteAssetDocument';
import { useUploadingDocumentNames } from './useUploadingDocumentNames';

const NO_DOCUMENTS: AssetDocument[] = [];

export function useAssetDocumentListViewModel(assetIdentifier: AssetIdentifier) {
  const documentLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const linkedFileLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const documents = useAssetDocuments(assetIdentifier, documentLimit.limit);
  const linkedFiles = useAssetLinkedFiles(assetIdentifier, linkedFileLimit.limit);
  const deleteMutation = useDeleteAssetDocument(assetIdentifier);
  const uploadingNames = useUploadingDocumentNames(assetIdentifier);

  const uploadedDocuments = documents.data?.items ?? NO_DOCUMENTS;
  const existingFiles = linkedFiles.data?.items ?? NO_DOCUMENTS;
  const hasNothingToShow =
    uploadedDocuments.length === 0 && uploadingNames.length === 0 && existingFiles.length === 0;

  function retry(): void {
    void documents.refetch();
  }

  function retryExistingFiles(): void {
    void linkedFiles.refetch();
  }

  async function deleteDocument(document: AssetDocument): Promise<void> {
    await deleteMutation.mutateAsync(document).catch(() => undefined);
  }

  function isDeleting(document: AssetDocument): boolean {
    return deleteMutation.isPending && isSameInstance(document, deleteMutation.variables);
  }

  return {
    uploadingNames,
    documents: uploadedDocuments,
    hasMoreDocuments: documents.data?.hasMore ?? false,
    isLoadingMoreDocuments: documents.isPlaceholderData,
    existingFiles,
    hasMoreExistingFiles: linkedFiles.data?.hasMore ?? false,
    isLoadingMoreExistingFiles: linkedFiles.isPlaceholderData,
    isPending:
      documents.isPending || (!documents.isError && hasNothingToShow && linkedFiles.isPending),
    isError: documents.isError,
    error: documents.error,
    isFetching: documents.isFetching,
    isEmpty: hasNothingToShow && documents.isSuccess && linkedFiles.isSuccess,
    hasExistingFilesError: linkedFiles.isError,
    existingFilesError: linkedFiles.error,
    isFetchingExistingFiles: linkedFiles.isFetching,
    deleteErrorMessage: deleteMutation.isError ? deleteMutation.error.message : null,
    retry,
    retryExistingFiles,
    showMoreDocuments: documentLimit.showMore,
    showMoreExistingFiles: linkedFileLimit.showMore,
    deleteDocument,
    isDeleting,
  };
}
