import { ASSET_PASSPORT_INSTANCE_SPACE } from './assets';

export const NOTE_VIEW_EXTERNAL_ID = 'Note';
export const NOTE_INSTANCE_SPACE = ASSET_PASSPORT_INSTANCE_SPACE;
export const NOTE_EXTERNAL_ID_PREFIX = 'note-';

export const NOTE_QUERY_LIMIT = 100;
export const NOTE_QUERY_STALE_TIME_MS = 30_000;
export const NOTE_TITLE_MAX_LENGTH = 100;
export const NOTE_BODY_MAX_LENGTH = 2000;

export const UNKNOWN_AUTHOR_LABEL = 'Unknown author';

export const NOTES_LOADING_MESSAGE = 'Loading notes...';
export const NOTES_ERROR_TITLE = 'Notes could not be loaded';
export const NOTES_ERROR_DESCRIPTION =
  'Check access to the Note view and the notes space, then try again.';
export const NOTES_EMPTY_TITLE = 'No notes yet';
export const NOTES_EMPTY_DESCRIPTION = 'Notes added to this asset will appear here.';
export const SHOW_MORE_NOTES_LABEL = 'Show more notes';
export const NOTE_DELETE_ERROR_TITLE = 'The note could not be deleted';
export const NOTE_SAVE_ERROR_TITLE = 'The note could not be saved';
