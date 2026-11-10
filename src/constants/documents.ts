export const DOCUMENT_VIEW_EXTERNAL_ID = 'Document';
export const DOCUMENT_INSTANCE_SPACE = 'sp-asset-passport-data';
export const DOCUMENT_EXTERNAL_ID_PREFIX = 'doc-';
export const DOCUMENT_QUERY_LIMIT = 100;
/**
 * The RMDM view of files, and its relation list to the assets a file belongs to. The app reads it by this
 * reference: it is not part of the Asset_Passport data model, because Fusion cannot import it there.
 */
export const FILES_VIEW_SPACE = 'sp-dm-idi-rmdm';
export const FILES_VIEW_EXTERNAL_ID = 'Files';
export const FILES_VIEW_VERSION = 'v1';
export const FILES_ASSETS_PROPERTY = 'assets';
export const DOCUMENT_QUERY_STALE_TIME_MS = 30_000;
export const DOCUMENT_MAX_FILE_SIZE_MB = 50;
export const DOCUMENT_MAX_FILE_SIZE_BYTES =
  DOCUMENT_MAX_FILE_SIZE_MB * 1024 * 1024;
export const DOCUMENT_MAX_FILE_SIZE_LABEL = `${DOCUMENT_MAX_FILE_SIZE_MB} MB`;
export const DEFAULT_DOCUMENT_MIME_TYPE = 'application/octet-stream';
/** CDF marks a file as uploaded a moment after its content arrives, so a fresh document is re-read until then. */
export const DOCUMENT_PENDING_POLL_MS = 2_000;
/** Documents still not uploaded this long after creation are left alone: their upload failed. */
export const DOCUMENT_PENDING_POLL_WINDOW_MS = 2 * 60_000;

/** Zoom of the document preview as a multiple of the page fitted to the dialog width. */
export const PREVIEW_DEFAULT_ZOOM = 1;
export const PREVIEW_MIN_ZOOM = 0.25;
export const PREVIEW_MAX_ZOOM = 5;
export const PREVIEW_ZOOM_STEP = 0.25;
