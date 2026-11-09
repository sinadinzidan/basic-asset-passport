import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import {
  NOTE_BODY_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from '../../constants/notes';
import { useAddAssetNote } from '../../hooks/notes/useAddAssetNote';
import { isNewAssetNoteValid } from '../../lib/noteInput';
import type { AssetIdentifier } from '../../types/asset';
import { AppAlert } from '../general/AppAlert';

type AssetNoteFormProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetNoteForm({ assetIdentifier }: AssetNoteFormProps) {
  const { mutate, isPending, isError, error } =
    useAddAssetNote(assetIdentifier);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const canSubmit = isNewAssetNoteValid({ title, body }) && !isPending;

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>): void {
    setTitle(event.target.value);
  }

  function handleBodyChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    setBody(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!canSubmit) return;

    mutate(
      { title, body },
      {
        onSuccess: () => {
          setTitle('');
          setBody('');
        },
      },
    );
  }

  return (
    <form className="data-card flex flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-title" required>
          Title
        </Label>
        <Input
          className="hud-field"
          id="note-title"
          maxLength={NOTE_TITLE_MAX_LENGTH}
          onChange={handleTitleChange}
          value={title}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note-body">Note</Label>
        <Textarea
          className="hud-field"
          id="note-body"
          maxLength={NOTE_BODY_MAX_LENGTH}
          onChange={handleBodyChange}
          rows={4}
          value={body}
        />
      </div>
      {isError ? (
        <AppAlert variant="error" title="The note could not be saved">
          {error instanceof Error ? error.message : 'Try again.'}
        </AppAlert>
      ) : null}
      <div>
        <Button className="hud-button" disabled={!canSubmit} type="submit">
          {isPending ? 'Saving...' : 'Add note'}
        </Button>
      </div>
    </form>
  );
}
