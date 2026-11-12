import { NOTE_QUERY_LIMIT } from '../../../constants/notes';
import { isSameInstance } from '../../../lib/instanceKey';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetNote } from '../../../types/note';
import { useListLimit } from '../../general/useListLimit';

import { useAssetNotes } from './useAssetNotes';
import { useDeleteAssetNote } from './useDeleteAssetNote';

const NO_NOTES: AssetNote[] = [];

export function useAssetNoteListViewModel(assetIdentifier: AssetIdentifier) {
  const { limit, showMore } = useListLimit(NOTE_QUERY_LIMIT);
  const { data, error, isError, isFetching, isPending, isPlaceholderData, refetch } = useAssetNotes(
    assetIdentifier,
    limit,
  );
  const deleteMutation = useDeleteAssetNote(assetIdentifier);

  function retry(): void {
    void refetch();
  }

  async function deleteNote({ space, externalId }: AssetNote): Promise<void> {
    await deleteMutation.mutateAsync({ space, externalId }).catch(() => undefined);
  }

  function isDeleting(note: AssetNote): boolean {
    return deleteMutation.isPending && isSameInstance(note, deleteMutation.variables);
  }

  return {
    notes: data?.items ?? NO_NOTES,
    hasMore: data?.hasMore ?? false,
    isLoadingMore: isPlaceholderData,
    error,
    isError,
    isFetching,
    isPending,
    deleteErrorMessage: deleteMutation.isError ? deleteMutation.error.message : null,
    retry,
    showMore,
    deleteNote,
    isDeleting,
  };
}
