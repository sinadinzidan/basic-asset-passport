import {
  NOTE_DELETE_ERROR_TITLE,
  NOTES_EMPTY_DESCRIPTION,
  NOTES_EMPTY_TITLE,
  NOTES_ERROR_DESCRIPTION,
  NOTES_ERROR_TITLE,
  NOTES_LOADING_MESSAGE,
  SHOW_MORE_NOTES_LABEL,
} from '../../../constants/notes';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetNoteListViewModel } from '../../../hooks/assets/notes/view-models/useAssetNoteListViewModel';
import { getErrorReason } from '../../../lib/errorReason';
import { getInstanceKey } from '../../../lib/instanceKey';
import {
  AppAlert,
  EmptyStateMessage,
  LoadingNotice,
  RetryAlert,
  ShowMoreButton,
} from '../../general';

import { AssetNoteItem } from './AssetNoteItem';

export function AssetNoteList() {
  const {
    notes,
    hasMore,
    isLoadingMore,
    error,
    isError,
    isFetching,
    isPending,
    deleteErrorMessage,
    retry,
    showMore,
    deleteNote,
    isDeleting,
  } = useAssetNoteListViewModel();

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
        onRetry={retry}
      />
    );
  }

  if (notes.length === 0) {
    return <EmptyStateMessage title={NOTES_EMPTY_TITLE} description={NOTES_EMPTY_DESCRIPTION} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteErrorMessage !== null ? (
        <AppAlert variant={AppAlertVariant.ERROR} title={NOTE_DELETE_ERROR_TITLE}>
          {deleteErrorMessage}
        </AppAlert>
      ) : null}
      {notes.map((note) => (
        <AssetNoteItem
          key={getInstanceKey(note)}
          note={note}
          isDeleting={isDeleting(note)}
          onDelete={deleteNote}
        />
      ))}
      {hasMore ? (
        <ShowMoreButton
          label={SHOW_MORE_NOTES_LABEL}
          isLoading={isLoadingMore}
          onShowMore={showMore}
        />
      ) : null}
    </div>
  );
}
