import { useMutationState } from '@tanstack/react-query';

import { DOCUMENT_QUERY_LIMIT } from '../../../constants/documents';
import { isSameInstance } from '../../../lib/instanceKey';
import type { AssetDocument } from '../../../types/document';
import { useListLimit } from '../../general/useListLimit';
import { useAssetContext } from '../useAssetContext';
import { useSelectedAsset } from '../useSelectedAsset';

import { useAssetDocuments } from './useAssetDocuments';
import { useAssetLinkedFiles } from './useAssetLinkedFiles';
import { useDeleteAssetDocument } from './useDeleteAssetDocument';
import { getUploadAssetDocumentsMutationKey } from './useUploadAssetDocuments';

const NO_DOCUMENTS: AssetDocument[] = [];

export function useAssetDocumentListViewModel() {
  const assetIdentifier = useSelectedAsset();
  const documentLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const linkedFileLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const documents = useAssetDocuments(assetIdentifier, documentLimit.limit);
  const linkedFiles = useAssetLinkedFiles(assetIdentifier, linkedFileLimit.limit);
  const deletion = useDeleteAssetDocument(assetIdentifier);
  const client = useAssetContext();
  const pendingUploads = useMutationState({
    filters: {
      mutationKey: getUploadAssetDocumentsMutationKey(client.project, assetIdentifier),
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables,
  });

  const uploadingNames = pendingUploads.flatMap(getFileNames);
  const uploadedDocuments = documents.data?.items ?? NO_DOCUMENTS;
  const existingFiles = linkedFiles.data?.items ?? NO_DOCUMENTS;
  const hasNothingToShow =
    uploadedDocuments.length === 0 && uploadingNames.length === 0 && existingFiles.length === 0;

  async function deleteDocument(document: AssetDocument): Promise<void> {
    await deletion.deleteDocument(document).catch(() => undefined);
  }

  function isDeleting(document: AssetDocument): boolean {
    return (
      deletion.deletingDocument !== null && isSameInstance(document, deletion.deletingDocument)
    );
  }

  return {
    uploadingNames,
    documents: uploadedDocuments,
    hasMoreDocuments: documents.data?.hasMore ?? false,
    isLoadingMoreDocuments: documents.isLoadingMore,
    existingFiles,
    hasMoreExistingFiles: linkedFiles.data?.hasMore ?? false,
    isLoadingMoreExistingFiles: linkedFiles.isLoadingMore,
    isPending:
      documents.isPending || (!documents.isError && hasNothingToShow && linkedFiles.isPending),
    isError: documents.isError,
    error: documents.error,
    isFetching: documents.isFetching,
    isEmpty:
      hasNothingToShow &&
      !documents.isPending &&
      !documents.isError &&
      !linkedFiles.isPending &&
      !linkedFiles.isError,
    hasExistingFilesError: linkedFiles.isError,
    existingFilesError: linkedFiles.error,
    isFetchingExistingFiles: linkedFiles.isFetching,
    deleteErrorMessage: deletion.error?.message ?? null,
    retry: documents.retry,
    retryExistingFiles: linkedFiles.retry,
    showMoreDocuments: documentLimit.showMore,
    showMoreExistingFiles: linkedFileLimit.showMore,
    deleteDocument,
    isDeleting,
  };
}

function getFileNames(variables: unknown): string[] {
  if (!Array.isArray(variables)) return [];

  return variables.flatMap((value: unknown) => (value instanceof File ? [value.name] : []));
}
