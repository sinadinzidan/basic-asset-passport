import type { DocumentOrigin } from '../enums/documentOrigin';
import type { DocumentUploadStatus } from '../enums/documentUploadStatus';

export type AssetDocument = {
  space: string;
  externalId: string;
  name: string;
  mimeType: string | null;
  isUploaded: boolean;
  uploadStatus: DocumentUploadStatus;
  origin: DocumentOrigin;
  uploadedTime: number | null;
  createdTime: number;
};

export type DocumentIdentifier = Pick<AssetDocument, 'space' | 'externalId'>;

export type DocumentUploadResult = {
  fileName: string;
  errorMessage: string | null;
};
