import { describe, expect, it } from 'vitest';

import {
  NOTE_BODY_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
} from '../../constants/notes';
import { isNewAssetNoteValid, normalizeNewAssetNote } from '../noteInput';

describe(isNewAssetNoteValid.name, () => {
  it('accepts a title with an optional body', () => {
    expect(isNewAssetNoteValid({ title: 'Inspection', body: '' })).toBe(true);
    expect(isNewAssetNoteValid({ title: 'Inspection', body: 'Done' })).toBe(
      true,
    );
  });

  it('rejects an empty or blank title', () => {
    expect(isNewAssetNoteValid({ title: '', body: 'text' })).toBe(false);
    expect(isNewAssetNoteValid({ title: '   ', body: 'text' })).toBe(false);
  });

  it('rejects a title or body over the limit', () => {
    expect(
      isNewAssetNoteValid({
        title: 'a'.repeat(NOTE_TITLE_MAX_LENGTH + 1),
        body: '',
      }),
    ).toBe(false);
    expect(
      isNewAssetNoteValid({
        title: 'Title',
        body: 'a'.repeat(NOTE_BODY_MAX_LENGTH + 1),
      }),
    ).toBe(false);
  });

  it('accepts a title and body exactly at the limit', () => {
    expect(
      isNewAssetNoteValid({
        title: 'a'.repeat(NOTE_TITLE_MAX_LENGTH),
        body: 'a'.repeat(NOTE_BODY_MAX_LENGTH),
      }),
    ).toBe(true);
  });
});

describe(normalizeNewAssetNote.name, () => {
  it('trims the title and the body', () => {
    expect(
      normalizeNewAssetNote({ title: '  Title ', body: ' Text\n' }),
    ).toEqual({ title: 'Title', body: 'Text' });
  });

  it('throws for an invalid note', () => {
    expect(() => normalizeNewAssetNote({ title: ' ', body: '' })).toThrow(
      `A note needs a title of up to ${NOTE_TITLE_MAX_LENGTH} characters and a text of up to ${NOTE_BODY_MAX_LENGTH}.`,
    );
  });
});
