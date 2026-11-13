import { BYTES_PER_KILOBYTE } from './number';
import { MS_PER_MINUTE } from './time';

export const DOCUMENT_EXTERNAL_ID_PREFIX = 'doc-';
export const DOCUMENT_QUERY_LIMIT = 100;

export const DOCUMENT_QUERY_STALE_TIME_MS = 30_000;
const DOCUMENT_MAX_FILE_SIZE_MB = 50;

export const DOCUMENT_MAX_FILE_SIZE_BYTES =
  DOCUMENT_MAX_FILE_SIZE_MB * BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;
const DOCUMENT_MAX_FILE_SIZE_LABEL = `${DOCUMENT_MAX_FILE_SIZE_MB} MB`;

export const DEFAULT_DOCUMENT_MIME_TYPE = 'application/octet-stream';
export const DOCUMENT_PENDING_POLL_MS = 2_000;
export const DOCUMENT_PENDING_POLL_MAX_MS = 16_000;
export const DOCUMENT_PENDING_POLL_STEP_MS = 10_000;
export const DOCUMENT_PENDING_POLL_BACKOFF_FACTOR = 2;
const DOCUMENT_PENDING_POLL_WINDOW_MINUTES = 2;

export const DOCUMENT_PENDING_POLL_WINDOW_MS = DOCUMENT_PENDING_POLL_WINDOW_MINUTES * MS_PER_MINUTE;

export const PREVIEW_DEFAULT_ZOOM = 1;
export const PREVIEW_MIN_ZOOM = 0.25;
export const PREVIEW_MAX_ZOOM = 5;
export const PREVIEW_ZOOM_STEP = 0.25;

export const DOCUMENTS_LOADING_MESSAGE = 'Loading documents...';
export const DOCUMENTS_ERROR_TITLE = 'Documents could not be loaded';
export const DOCUMENTS_ERROR_DESCRIPTION =
  'Check access to the Document view and the documents space, then try again.';
export const DOCUMENTS_EMPTY_TITLE = 'No documents yet';
export const DOCUMENTS_EMPTY_DESCRIPTION =
  'Documents uploaded to this asset and files already linked to it will appear here.';
export const LINKED_FILES_ERROR_TITLE = 'Existing files could not be loaded';
export const LINKED_FILES_ERROR_DESCRIPTION =
  'Check access to the Files view and the space that holds the files, then try again.';
export const SHOW_MORE_DOCUMENTS_LABEL = 'Show more uploaded documents';
export const SHOW_MORE_LINKED_FILES_LABEL = 'Show more existing files';
export const DOCUMENT_DELETE_ERROR_TITLE = 'The document could not be deleted';
export const DOCUMENT_UPLOAD_ERROR_TITLE = 'Some documents could not be uploaded';
export const DOCUMENT_UPLOAD_RETRY_LABEL = 'Try again';
export const DOCUMENT_UPLOAD_FAILED_MESSAGE = 'Upload failed.';
export const ANNOTATED_ASSET_LOADING_MESSAGE = 'Loading asset...';
export const ANNOTATED_ASSET_ERROR_TITLE = 'Asset could not be loaded';
export const ANNOTATED_ASSET_ERROR_DESCRIPTION =
  'Check that the linked item is an asset in the register and that you can read it, then try again.';
export const ANNOTATED_ASSET_PENDING_TITLE = 'Linked asset';
export const DOCUMENT_UPLOAD_HINT = `Choose one or more files, up to ${DOCUMENT_MAX_FILE_SIZE_LABEL} each.`;
export const DOCUMENT_EMPTY_FILE_MESSAGE = 'The file is empty.';
export const DOCUMENT_TOO_LARGE_MESSAGE = `The file is larger than ${DOCUMENT_MAX_FILE_SIZE_LABEL}.`;
export const EXISTING_FILE_LABEL = 'Existing file';
export const DOCUMENT_UPLOADING_LABEL = 'Uploading...';
export const DOCUMENT_PROCESSING_LABEL = 'Processing...';
export const DOCUMENT_UPLOAD_INCOMPLETE_LABEL = 'Upload incomplete';
export const DOCUMENT_UPLOADED_PREFIX = 'Uploaded';
export const DOCUMENT_DELETE_DIALOG_TITLE = 'Delete document?';
export const DOCUMENT_DELETE_WARNING =
  'and its file will be deleted permanently. This cannot be undone.';
export const DOCUMENT_PREVIEW_LOADING_MESSAGE = 'Loading preview...';
export const DOCUMENT_PREVIEW_UNAVAILABLE_MESSAGE = 'Preview is not available here.';
