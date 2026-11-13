import { IconNote, IconPencil, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';

import {
  NOTE_DELETE_DIALOG_TITLE,
  NOTE_DELETE_WARNING,
  UNKNOWN_AUTHOR_LABEL,
} from '../../../constants/notes';
import { IconActionVariant } from '../../../enums/iconActionVariant';
import { useAssetNoteItemViewModel } from '../../../hooks/assets/notes/useAssetNoteItemViewModel';
import { formatNoteDate } from '../../../lib/formatNoteDate';
import type { AssetNote, NewAssetNote } from '../../../types/note';
import { ConfirmDeleteDialog, IconActionButton } from '../../general';

import { AssetNoteEditForm } from './AssetNoteEditForm';

type AssetNoteItemProps = {
  note: AssetNote;
  isDeleting: boolean;
  onDelete: (note: AssetNote) => Promise<void>;
};

export function AssetNoteItem({ note, isDeleting, onDelete }: AssetNoteItemProps) {
  const { isSaving, saveErrorMessage, save, discardSaveError } = useAssetNoteItemViewModel(note);

  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  function handleEditClick(): void {
    setIsEditing(true);
  }
  function handleEditCancel(): void {
    setIsEditing(false);
    discardSaveError();
  }
  function handleSave(input: NewAssetNote): void {
    save(input, () => setIsEditing(false));
  }
  function handleDeleteClick(): void {
    setIsConfirmingDelete(true);
  }
  function handleDeleteConfirm(): Promise<void> {
    return onDelete(note);
  }
  function handleDeleteClose(): void {
    setIsConfirmingDelete(false);
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
            {note.author ?? UNKNOWN_AUTHOR_LABEL} · {formatNoteDate(note.createdTime)}
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
            variant={IconActionVariant.DESTRUCTIVE}
          />
        </div>
      </header>
      {note.body ? <p className="whitespace-pre-wrap break-words p-4">{note.body}</p> : null}
      <ConfirmDeleteDialog
        isOpen={isConfirmingDelete}
        title={NOTE_DELETE_DIALOG_TITLE}
        confirmLabel="Delete note"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
      >
        {note.title} {NOTE_DELETE_WARNING}
      </ConfirmDeleteDialog>
    </article>
  );
}
