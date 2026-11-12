import {
  DOCUMENT_DELETE_ERROR_TITLE,
  DOCUMENT_QUERY_LIMIT,
  DOCUMENTS_EMPTY_DESCRIPTION,
  DOCUMENTS_EMPTY_TITLE,
  DOCUMENTS_ERROR_DESCRIPTION,
  DOCUMENTS_ERROR_TITLE,
  DOCUMENTS_LOADING_MESSAGE,
  LINKED_FILES_ERROR_DESCRIPTION,
  LINKED_FILES_ERROR_TITLE,
  SHOW_MORE_DOCUMENTS_LABEL,
  SHOW_MORE_LINKED_FILES_LABEL,
} from '../../../constants/documents';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetDocuments } from '../../../hooks/assets/documents/useAssetDocuments';
import { useAssetLinkedFiles } from '../../../hooks/assets/documents/useAssetLinkedFiles';
import { useDeleteAssetDocument } from '../../../hooks/assets/documents/useDeleteAssetDocument';
import { useUploadingDocumentNames } from '../../../hooks/assets/documents/useUploadingDocumentNames';
import { useListLimit } from '../../../hooks/general/useListLimit';
import { getErrorReason } from '../../../lib/errorReason';
import { getInstanceKey, isSameInstance } from '../../../lib/instanceKey';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetDocument } from '../../../types/document';
import { AppAlert } from '../../general/AppAlert';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { ShowMoreButton } from '../../general/ShowMoreButton';

import { AssetDocumentItem } from './AssetDocumentItem';
import { AssetDocumentUploadingItem } from './AssetDocumentUploadingItem';

type AssetDocumentListProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDocumentList({ assetIdentifier }: AssetDocumentListProps) {
  const documentLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const linkedFileLimit = useListLimit(DOCUMENT_QUERY_LIMIT);
  const { data, error, isError, isFetching, isPending, isPlaceholderData, refetch } =
    useAssetDocuments(assetIdentifier, documentLimit.limit);
  const linkedFiles = useAssetLinkedFiles(assetIdentifier, linkedFileLimit.limit);
  const deleteMutation = useDeleteAssetDocument(assetIdentifier);
  const uploadingNames = useUploadingDocumentNames(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }
  function handleLinkedFilesRetry(): void {
    void linkedFiles.refetch();
  }
  async function handleDelete(document: AssetDocument): Promise<void> {
    await deleteMutation.mutateAsync(document).catch(() => undefined);
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message={DOCUMENTS_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title={DOCUMENTS_ERROR_TITLE}
        description={DOCUMENTS_ERROR_DESCRIPTION}
        reason={getErrorReason(error)}
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  const documents = data.items;
  const existingFiles = linkedFiles.data?.items ?? [];
  const hasNothingToShow =
    documents.length === 0 && uploadingNames.length === 0 && existingFiles.length === 0;

  if (hasNothingToShow && linkedFiles.isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message={DOCUMENTS_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (hasNothingToShow && !linkedFiles.isError) {
    return (
      <EmptyStateMessage title={DOCUMENTS_EMPTY_TITLE} description={DOCUMENTS_EMPTY_DESCRIPTION} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteMutation.isError ? (
        <AppAlert variant={AppAlertVariant.ERROR} title={DOCUMENT_DELETE_ERROR_TITLE}>
          {deleteMutation.error.message}
        </AppAlert>
      ) : null}
      {linkedFiles.isError ? (
        <RetryAlert
          title={LINKED_FILES_ERROR_TITLE}
          description={LINKED_FILES_ERROR_DESCRIPTION}
          reason={getErrorReason(linkedFiles.error)}
          isRetrying={linkedFiles.isFetching}
          onRetry={handleLinkedFilesRetry}
        />
      ) : null}
      {uploadingNames.map((name, index) => (
        <AssetDocumentUploadingItem key={`${index}:${name}`} name={name} />
      ))}
      {documents.map((document) => (
        <AssetDocumentItem
          key={getInstanceKey(document)}
          document={document}
          isDeleting={
            deleteMutation.isPending && isSameInstance(document, deleteMutation.variables)
          }
          onDelete={handleDelete}
        />
      ))}
      {data.hasMore ? (
        <ShowMoreButton
          label={SHOW_MORE_DOCUMENTS_LABEL}
          isLoading={isPlaceholderData}
          onShowMore={documentLimit.showMore}
        />
      ) : null}
      {existingFiles.map((file) => (
        <AssetDocumentItem
          key={getInstanceKey(file)}
          document={file}
          isDeleting={false}
          onDelete={handleDelete}
        />
      ))}
      {linkedFiles.data?.hasMore ? (
        <ShowMoreButton
          label={SHOW_MORE_LINKED_FILES_LABEL}
          isLoading={linkedFiles.isPlaceholderData}
          onShowMore={linkedFileLimit.showMore}
        />
      ) : null}
    </div>
  );
}
