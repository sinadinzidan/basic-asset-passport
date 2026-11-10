import { useAssetNotes } from '../../../hooks/assets/notes/useAssetNotes';
import { useDeleteAssetNote } from '../../../hooks/assets/notes/useDeleteAssetNote';
import { useUpdateAssetNote } from '../../../hooks/assets/notes/useUpdateAssetNote';
import type { AssetIdentifier } from '../../../types/asset';
import type {
  AssetNote,
  NewAssetNote,
  NoteIdentifier,
} from '../../../types/note';
import { AppAlert } from '../../general/AppAlert';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';

import { AssetNoteItem } from './AssetNoteItem';

type AssetNoteListProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNoteList({ assetIdentifier }: AssetNoteListProps) {
  const { data, isError, isFetching, isPending, refetch } =
    useAssetNotes(assetIdentifier);
  const updateMutation = useUpdateAssetNote(assetIdentifier);
  const deleteMutation = useDeleteAssetNote(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }

  function handleSave(
    note: AssetNote,
    input: NewAssetNote,
    onSaved: () => void,
  ): void {
    updateMutation.mutate(
      { note: toNoteIdentifier(note), input },
      { onSuccess: onSaved },
    );
  }

  function handleCancelEdit(): void {
    updateMutation.reset();
  }

  async function handleDelete(note: AssetNote): Promise<void> {
    // A failure is shown from the mutation's own error state.
    await deleteMutation
      .mutateAsync(toNoteIdentifier(note))
      .catch(() => undefined);
  }

  if (isPending) {
    return <LoadingNotice
        className="p-6"
        message="Loading notes..."
        variant="CARD"
      />;
  }

  if (isError) {
    return (
      <RetryAlert
        title="Notes could not be loaded"
        description="Check access to the Note view and the notes space, then try again."
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyStateMessage
        title="No notes yet"
        description="Notes added to this asset will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {deleteMutation.isError ? (
        <AppAlert variant="error" title="The note could not be deleted">
          {deleteMutation.error.message}
        </AppAlert>
      ) : null}
      {data.map((note) => (
        <AssetNoteItem
          key={`${note.space}:${note.externalId}`}
          note={note}
          isSaving={
            updateMutation.isPending &&
            isSameNote(note, updateMutation.variables?.note)
          }
          isDeleting={
            deleteMutation.isPending &&
            isSameNote(note, deleteMutation.variables)
          }
          saveErrorMessage={
            updateMutation.isError &&
            isSameNote(note, updateMutation.variables.note)
              ? updateMutation.error.message
              : null
          }
          onSave={handleSave}
          onCancelEdit={handleCancelEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

function toNoteIdentifier(note: AssetNote): NoteIdentifier {
  return { space: note.space, externalId: note.externalId };
}

function isSameNote(
  note: AssetNote,
  other: Partial<AssetNote> | undefined,
): boolean {
  return other?.space === note.space && other?.externalId === note.externalId;
}
