import { DocumentOrigin } from '../enums/documentOrigin';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

export function makeAssetDocument(overrides: Partial<AssetDocument> = {}): AssetDocument {
  return {
    space: 'sp-asset-passport-data',
    externalId: 'doc-1',
    name: 'Pump manual.pdf',
    mimeType: 'application/pdf',
    isUploaded: true,
    uploadStatus: DocumentUploadStatus.UPLOADED,
    origin: DocumentOrigin.APP,
    uploadedTime: new Date(2026, 10, 5, 12).getTime(),
    createdTime: new Date(2026, 10, 5, 12).getTime(),
    ...overrides,
  };
}
