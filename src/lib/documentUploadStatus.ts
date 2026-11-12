import { DOCUMENT_PENDING_POLL_WINDOW_MS } from '../constants/documents';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

export function getDocumentUploadStatus(
  document: Pick<AssetDocument, 'isUploaded' | 'createdTime'>,
  now: number,
): DocumentUploadStatus {
  if (document.isUploaded) return DocumentUploadStatus.UPLOADED;

  return now - document.createdTime <= DOCUMENT_PENDING_POLL_WINDOW_MS
    ? DocumentUploadStatus.PROCESSING
    : DocumentUploadStatus.INCOMPLETE;
}
