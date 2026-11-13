import {
  DOCUMENT_DELETE_ERROR_TITLE,
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
import { useAssetDocumentListViewModel } from '../../../hooks/assets/documents/view-models/useAssetDocumentListViewModel';
import { getErrorReason } from '../../../lib/errorReason';
import { getInstanceKey } from '../../../lib/instanceKey';
import {
  AppAlert,
  EmptyStateMessage,
  LoadingNotice,
  RetryAlert,
  ShowMoreButton,
} from '../../general';

import { AssetDocumentItem } from './AssetDocumentItem';
import { AssetDocumentUploadingItem } from './AssetDocumentUploadingItem';

export function AssetDocumentList() {
  const {
    uploadingNames,
    documents,
    hasMoreDocuments,
    isLoadingMoreDocuments,
    existingFiles,
    hasMoreExistingFiles,
    isLoadingMoreExistingFiles,
    isPending,
    isError,
    error,
    isFetching,
    isEmpty,
    hasExistingFilesError,
    existingFilesError,
    isFetchingExistingFiles,
    deleteErrorMessage,
    retry,
    retryExistingFiles,
    showMoreDocuments,
    showMoreExistingFiles,
    deleteDocument,
    isDeleting,
  } = useAssetDocumentListViewModel();

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
        onRetry={retry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyStateMessage title={DOCUMENTS_EMPTY_TITLE} description={DOCUMENTS_EMPTY_DESCRIPTION} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteErrorMessage !== null ? (
        <AppAlert variant={AppAlertVariant.ERROR} title={DOCUMENT_DELETE_ERROR_TITLE}>
          {deleteErrorMessage}
        </AppAlert>
      ) : null}
      {hasExistingFilesError ? (
        <RetryAlert
          title={LINKED_FILES_ERROR_TITLE}
          description={LINKED_FILES_ERROR_DESCRIPTION}
          reason={getErrorReason(existingFilesError)}
          isRetrying={isFetchingExistingFiles}
          onRetry={retryExistingFiles}
        />
      ) : null}
      {uploadingNames.map((name, index) => (
        <AssetDocumentUploadingItem key={`${index}:${name}`} name={name} />
      ))}
      {documents.map((document) => (
        <AssetDocumentItem
          key={getInstanceKey(document)}
          document={document}
          isDeleting={isDeleting(document)}
          onDelete={deleteDocument}
        />
      ))}
      {hasMoreDocuments ? (
        <ShowMoreButton
          label={SHOW_MORE_DOCUMENTS_LABEL}
          isLoading={isLoadingMoreDocuments}
          onShowMore={showMoreDocuments}
        />
      ) : null}
      {existingFiles.map((file) => (
        <AssetDocumentItem
          key={getInstanceKey(file)}
          document={file}
          isDeleting={false}
          onDelete={deleteDocument}
        />
      ))}
      {hasMoreExistingFiles ? (
        <ShowMoreButton
          label={SHOW_MORE_LINKED_FILES_LABEL}
          isLoading={isLoadingMoreExistingFiles}
          onShowMore={showMoreExistingFiles}
        />
      ) : null}
    </div>
  );
}
