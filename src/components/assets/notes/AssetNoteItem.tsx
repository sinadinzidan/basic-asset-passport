import { IconNote, IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import { UNKNOWN_AUTHOR_LABEL } from '../../../constants/notes';
import { formatNoteDate } from '../../../lib/formatNoteDate';
import type { AssetNote, NewAssetNote } from '../../../types/note';
import { GeneralButton } from '../../general/GeneralButton';
import { GeneralDialog } from '../../general/GeneralDialog';
import { IconActionButton } from '../../general/IconActionButton';

import { AssetNoteEditForm } from './AssetNoteEditForm';

type AssetNoteItemProps = {
  note: AssetNote;
  isSaving: boolean;
  isDeleting: boolean;
  saveErrorMessage: string | null;
  /** Saves the edit; `onSaved` runs once it has been saved. */
  onSave: (note: AssetNote, input: NewAssetNote, onSaved: () => void) => void;
  onCancelEdit: () => void;
  /** Resolves when the delete is over, whether it worked or not. */
  onDelete: (note: AssetNote) => Promise<void>;
};

export function AssetNoteItem({
  note,
  isSaving,
  isDeleting,
  saveErrorMessage,
  onSave,
  onCancelEdit,
  onDelete,
}: AssetNoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleteRunning, setIsDeleteRunning] = useState(false);

  function handleEditClick(): void {
    setIsEditing(true);
  }

  function handleEditCancel(): void {
    setIsEditing(false);
    onCancelEdit();
  }

  function handleSave(input: NewAssetNote): void {
    onSave(note, input, () => setIsEditing(false));
  }

  function handleDeleteClick(): void {
    setIsConfirmingDelete(true);
  }

  async function handleDeleteConfirm(): Promise<void> {
    setIsDeleteRunning(true);
    try {
      await onDelete(note);
    } finally {
      setIsDeleteRunning(false);
      setIsConfirmingDelete(false);
    }
  }

  function handleDeleteCancel(): void {
    setIsConfirmingDelete(false);
  }

  function handleConfirmOpenChange(isOpen: boolean): void {
    // The dialog stays until the delete is over.
    if (!isDeleteRunning) setIsConfirmingDelete(isOpen);
  }

  if (isEditing) {
    return (
      <article className="data-card">
        <AssetNoteEditForm
          note={note}
          isSaving={isSaving}
          errorMessage={saveErrorMessage}
          onSave={handleSave}
          onCancel={handleEditCancel}
        />
      </article>
    );
  }

  return (
    <article className="data-card">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconNote className="size-5" />
          </span>
          <h3 className="font-display min-w-0 break-words text-lg font-semibold tracking-wide">
            {note.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="data-card__id">
            {note.author ?? UNKNOWN_AUTHOR_LABEL} ·{' '}
            {formatNoteDate(note.createdTime)}
          </p>
          <IconActionButton
            icon={<IconPencil aria-hidden className="size-4" />}
            isDisabled={isDeleting}
            label={`Edit ${note.title}`}
            onClick={handleEditClick}
          />
          <IconActionButton
            icon={<IconTrash aria-hidden className="size-4" />}
            isDisabled={isDeleting}
            label={`Delete ${note.title}`}
            onClick={handleDeleteClick}
            variant="destructive"
          />
        </div>
      </header>
      {note.body ? (
        <p className="whitespace-pre-wrap break-words p-4">{note.body}</p>
      ) : null}
      <GeneralDialog
        isOpen={isConfirmingDelete}
        onOpenChange={handleConfirmOpenChange}
        title="Delete note?"
        footer={
          <>
            <GeneralButton
              disabled={isDeleteRunning}
              onClick={handleDeleteCancel}
              variant="outline"
            >
              Cancel
            </GeneralButton>
            <GeneralButton
              disabled={isDeleteRunning}
              onClick={() => void handleDeleteConfirm()}
              variant="destructive"
            >
              {isDeleteRunning ? 'Deleting...' : 'Delete note'}
            </GeneralButton>
          </>
        }
      >
        {note.title} will be deleted permanently. This cannot be undone.
      </GeneralDialog>
    </article>
  );
}
