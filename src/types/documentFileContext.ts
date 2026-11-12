import type { DocumentIdentifier } from './document';

export type DocumentFileContextType = {
  requestUploadUrl: (document: DocumentIdentifier) => Promise<string>;
  uploadContent: (uploadUrl: string, file: File) => Promise<void>;
};
