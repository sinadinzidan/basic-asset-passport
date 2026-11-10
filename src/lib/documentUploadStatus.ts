import { DOCUMENT_PENDING_POLL_WINDOW_MS } from '../constants/documents';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

/**
 * CDF marks a file as uploaded a moment after its content arrives. A document
 * that is not marked yet is still being processed while it is young, and only
 * counts as an unfinished upload once that window has passed.
 */
export function getDocumentUploadStatus(
  document: Pick<AssetDocument, 'isUploaded' | 'createdTime'>,
  now: number,
): DocumentUploadStatus {
  if (document.isUploaded) return DocumentUploadStatus.UPLOADED;

  return now - document.createdTime <= DOCUMENT_PENDING_POLL_WINDOW_MS
    ? DocumentUploadStatus.PROCESSING
    : DocumentUploadStatus.INCOMPLETE;
}
