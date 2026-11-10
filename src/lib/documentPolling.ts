import { DOCUMENT_PENDING_POLL_MS } from '../constants/documents';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

/**
 * How often to re-read the documents: only while one is still being processed
 * by CDF. Unfinished older uploads are not worth polling for.
 */
export function getDocumentRefetchInterval(
  documents: AssetDocument[] | undefined,
): number | false {
  const isProcessing = (documents ?? []).some(
    (document) => document.uploadStatus === DocumentUploadStatus.PROCESSING,
  );

  return isProcessing ? DOCUMENT_PENDING_POLL_MS : false;
}
