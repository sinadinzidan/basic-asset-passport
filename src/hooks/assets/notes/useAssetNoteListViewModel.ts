import { NOTE_QUERY_LIMIT } from '../../../constants/notes';
import { isSameInstance } from '../../../lib/instanceKey';
import type { AssetNote } from '../../../types/note';
import { useListLimit } from '../../general/useListLimit';
import { useSelectedAsset } from '../useSelectedAsset';

import { useAssetNotes } from './useAssetNotes';
import { useDeleteAssetNote } from './useDeleteAssetNote';

const NO_NOTES: AssetNote[] = [];

export function useAssetNoteListViewModel() {
  const assetIdentifier = useSelectedAsset();
  const { limit, showMore } = useListLimit(NOTE_QUERY_LIMIT);
  const { data, error, isError, isFetching, isPending, isLoadingMore, retry } = useAssetNotes(
    assetIdentifier,
    limit,
  );
  const deletion = useDeleteAssetNote(assetIdentifier);

  async function deleteNote({ space, externalId }: AssetNote): Promise<void> {
    await deletion.deleteNote({ space, externalId }).catch(() => undefined);
  }

  function isDeleting(note: AssetNote): boolean {
    return deletion.deletingNote !== null && isSameInstance(note, deletion.deletingNote);
  }

  return {
    notes: data?.items ?? NO_NOTES,
    hasMore: data?.hasMore ?? false,
    isLoadingMore,
    error,
    isError,
    isFetching,
    isPending,
    deleteErrorMessage: deletion.error?.message ?? null,
    retry,
    showMore,
    deleteNote,
    isDeleting,
  };
}
