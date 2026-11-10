import type { DocumentIdentifier } from './document';

/**
 * File upload operations for document nodes. The SDK has no helper for files
 * managed by data modeling, so the live implementation adapts the Files API
 * (`/files/uploadlink`); mock mode supplies dummy data. Reading a file is done
 * by the file viewer.
 */
export type DocumentFileClient = {
  /** A temporary link to send the file content to. */
  requestUploadUrl: (document: DocumentIdentifier) => Promise<string>;
  uploadContent: (uploadUrl: string, file: File) => Promise<void>;
};
