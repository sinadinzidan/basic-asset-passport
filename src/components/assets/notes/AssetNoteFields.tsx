import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import type { ChangeEvent } from 'react';

import { NOTE_BODY_MAX_LENGTH, NOTE_TITLE_MAX_LENGTH } from '../../../constants/notes';

type AssetNoteFieldsProps = {
  idPrefix: string;
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
};

export function AssetNoteFields({
  idPrefix,
  title,
  body,
  onTitleChange,
  onBodyChange,
}: AssetNoteFieldsProps) {
  function handleTitleChange(event: ChangeEvent<HTMLInputElement>): void {
    onTitleChange(event.target.value);
  }

  function handleBodyChange(event: ChangeEvent<HTMLTextAreaElement>): void {
    onBodyChange(event.target.value);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-title`} required>
          Title
        </Label>
        <div className="hud-field-box">
          <Input
            className="hud-field-box__control"
            id={`${idPrefix}-title`}
            maxLength={NOTE_TITLE_MAX_LENGTH}
            onChange={handleTitleChange}
            placeholder="Give the note a short title"
            value={title}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-body`}>Note</Label>
        <div className="hud-field-box">
          <Textarea
            className="hud-field-box__control"
            id={`${idPrefix}-body`}
            maxLength={NOTE_BODY_MAX_LENGTH}
            onChange={handleBodyChange}
            placeholder="Write what you found"
            rows={4}
            value={body}
          />
        </div>
      </div>
    </>
  );
}
