import { NOTE_INVALID_MESSAGE } from '../constants/notes';
import { NewAssetNoteSchema } from '../schemas/note';
import type { NewAssetNote } from '../types/note';

export function isNewAssetNoteValid(input: NewAssetNote): boolean {
  return NewAssetNoteSchema.safeParse(input).success;
}

export function normalizeNewAssetNote(input: NewAssetNote): NewAssetNote {
  const parsed = NewAssetNoteSchema.safeParse(input);

  if (!parsed.success) throw new Error(NOTE_INVALID_MESSAGE);

  return parsed.data;
}
