import {
  DOCUMENT_PENDING_POLL_BACKOFF_FACTOR,
  DOCUMENT_PENDING_POLL_MAX_MS,
  DOCUMENT_PENDING_POLL_MS,
  DOCUMENT_PENDING_POLL_STEP_MS,
} from '../constants/documents';
import { DocumentUploadStatus } from '../enums/documentUploadStatus';
import type { AssetDocument } from '../types/document';

export function getDocumentRefetchInterval(
  documents: AssetDocument[] | undefined,
  currentTimeMs: number,
): number | false {
  const processing = (documents ?? []).filter(
    (document) => document.uploadStatus === DocumentUploadStatus.PROCESSING,
  );

  if (processing.length === 0) return false;

  const newestCreatedTime = Math.max(...processing.map((document) => document.createdTime));

  const waitedSteps = Math.floor(
    Math.max(0, currentTimeMs - newestCreatedTime) / DOCUMENT_PENDING_POLL_STEP_MS,
  );

  return Math.min(
    DOCUMENT_PENDING_POLL_MAX_MS,
    DOCUMENT_PENDING_POLL_MS * DOCUMENT_PENDING_POLL_BACKOFF_FACTOR ** waitedSteps,
  );
}
