import {
  NOTE_DELETE_ERROR_TITLE,
  NOTE_QUERY_LIMIT,
  NOTES_EMPTY_DESCRIPTION,
  NOTES_EMPTY_TITLE,
  NOTES_ERROR_DESCRIPTION,
  NOTES_ERROR_TITLE,
  NOTES_LOADING_MESSAGE,
  SHOW_MORE_NOTES_LABEL,
} from '../../../constants/notes';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetNotes } from '../../../hooks/assets/notes/useAssetNotes';
import { useDeleteAssetNote } from '../../../hooks/assets/notes/useDeleteAssetNote';
import { useListLimit } from '../../../hooks/general/useListLimit';
import { getErrorReason } from '../../../lib/errorReason';
import { getInstanceKey, isSameInstance } from '../../../lib/instanceKey';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetNote } from '../../../types/note';
import { AppAlert } from '../../general/AppAlert';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { ShowMoreButton } from '../../general/ShowMoreButton';

import { AssetNoteItem } from './AssetNoteItem';

type AssetNoteListProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNoteList({ assetIdentifier }: AssetNoteListProps) {
  const { limit, showMore } = useListLimit(NOTE_QUERY_LIMIT);
  const { data, error, isError, isFetching, isPending, isPlaceholderData, refetch } = useAssetNotes(
    assetIdentifier,
    limit,
  );
  const deleteMutation = useDeleteAssetNote(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }
  async function handleDelete(note: AssetNote): Promise<void> {
    await deleteMutation
      .mutateAsync({ space: note.space, externalId: note.externalId })
      .catch(() => undefined);
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message={NOTES_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title={NOTES_ERROR_TITLE}
        description={NOTES_ERROR_DESCRIPTION}
        reason={getErrorReason(error)}
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (data.items.length === 0) {
    return <EmptyStateMessage title={NOTES_EMPTY_TITLE} description={NOTES_EMPTY_DESCRIPTION} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteMutation.isError ? (
        <AppAlert variant={AppAlertVariant.ERROR} title={NOTE_DELETE_ERROR_TITLE}>
          {deleteMutation.error.message}
        </AppAlert>
      ) : null}
      {data.items.map((note) => (
        <AssetNoteItem
          key={getInstanceKey(note)}
          assetIdentifier={assetIdentifier}
          note={note}
          isDeleting={deleteMutation.isPending && isSameInstance(note, deleteMutation.variables)}
          onDelete={handleDelete}
        />
      ))}
      {data.hasMore ? (
        <ShowMoreButton
          label={SHOW_MORE_NOTES_LABEL}
          isLoading={isPlaceholderData}
          onShowMore={showMore}
        />
      ) : null}
    </div>
  );
}
