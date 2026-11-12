import { DOCUMENT_PENDING_POLL_MS } from '../constants/documents';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

export function getDocumentRefetchInterval(documents: AssetDocument[] | undefined): number | false {
  const isProcessing = (documents ?? []).some(
    (document) => document.uploadStatus === DocumentUploadStatus.PROCESSING,
  );

  return isProcessing ? DOCUMENT_PENDING_POLL_MS : false;
}
