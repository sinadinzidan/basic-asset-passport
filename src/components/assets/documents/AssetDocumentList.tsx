import { useAssetDocuments } from '../../../hooks/assets/documents/useAssetDocuments';
import { useAssetLinkedFiles } from '../../../hooks/assets/documents/useAssetLinkedFiles';
import { useDeleteAssetDocument } from '../../../hooks/assets/documents/useDeleteAssetDocument';
import { useUploadingDocumentNames } from '../../../hooks/assets/documents/useUploadingDocumentNames';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetDocument } from '../../../types/document';
import { AppAlert } from '../../general/AppAlert';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';

import { AssetDocumentItem } from './AssetDocumentItem';
import { AssetDocumentUploadingItem } from './AssetDocumentUploadingItem';

type AssetDocumentListProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDocumentList({ assetIdentifier }: AssetDocumentListProps) {
  const { data, isError, isFetching, isPending, refetch } =
    useAssetDocuments(assetIdentifier);
  const linkedFiles = useAssetLinkedFiles(assetIdentifier);
  const deleteMutation = useDeleteAssetDocument(assetIdentifier);
  const uploadingNames = useUploadingDocumentNames(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }

  async function handleDelete(document: AssetDocument): Promise<void> {
    // A failure is shown from the mutation's own error state.
    await deleteMutation.mutateAsync(document).catch(() => undefined);
  }

  if (isPending) {
    return <LoadingNotice
        className="p-6"
        message="Loading documents..."
        variant="CARD"
      />;
  }

  if (isError) {
    return (
      <RetryAlert
        title="Documents could not be loaded"
        description="Check access to the Document view and the documents space, then try again."
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  const existingFiles = linkedFiles.data ?? [];
  const hasNothingToShow =
    data.length === 0 &&
    uploadingNames.length === 0 &&
    existingFiles.length === 0;

  if (hasNothingToShow && linkedFiles.isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message="Loading documents..."
        variant="CARD"
      />
    );
  }

  if (hasNothingToShow && !linkedFiles.isError) {
    return (
      <EmptyStateMessage
        title="No documents yet"
        description="Documents uploaded to this asset and files already linked to it will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteMutation.isError ? (
        <AppAlert variant="error" title="The document could not be deleted">
          {deleteMutation.error.message}
        </AppAlert>
      ) : null}
      {linkedFiles.isError ? (
        <RetryAlert
          title="Existing files could not be loaded"
          description="Check access to the Files view and the space that holds the files, then try again."
          isRetrying={linkedFiles.isFetching}
          onRetry={() => void linkedFiles.refetch()}
        />
      ) : null}
      {uploadingNames.map((name, index) => (
        <AssetDocumentUploadingItem key={`${index}:${name}`} name={name} />
      ))}
      {data.map((document) => (
        <AssetDocumentItem
          key={`${document.space}:${document.externalId}`}
          document={document}
          isDeleting={
            deleteMutation.isPending &&
            isSameDocument(document, deleteMutation.variables)
          }
          onDelete={handleDelete}
        />
      ))}
      {existingFiles.map((file) => (
        <AssetDocumentItem
          key={`${file.space}:${file.externalId}`}
          document={file}
          isDeleting={false}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

function isSameDocument(
  document: AssetDocument,
  other: Partial<AssetDocument> | undefined,
): boolean {
  return (
    other?.space === document.space && other?.externalId === document.externalId
  );
}
