import {
  NOTE_BODY_MAX_LENGTH,
  NOTE_INVALID_MESSAGE,
  NOTE_TITLE_MAX_LENGTH,
} from '../constants/notes';
import type { NewAssetNote } from '../types/note';

export function isNewAssetNoteValid(input: NewAssetNote): boolean {
  const title = input.title.trim();

  return (
    title.length > 0 &&
    title.length <= NOTE_TITLE_MAX_LENGTH &&
    input.body.trim().length <= NOTE_BODY_MAX_LENGTH
  );
}

export function normalizeNewAssetNote(input: NewAssetNote): NewAssetNote {
  if (!isNewAssetNoteValid(input)) {
    throw new Error(NOTE_INVALID_MESSAGE);
  }

  return { title: input.title.trim(), body: input.body.trim() };
}
