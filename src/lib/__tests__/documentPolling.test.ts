import { describe, expect, it } from 'vitest';

import { DOCUMENT_PENDING_POLL_MS } from '../../constants/documents';
import { DocumentUploadStatus } from '../../enums/documentUploadStatus';
import { makeAssetDocument } from '../../mocks/documents';
import { getDocumentRefetchInterval } from '../documentPolling';

describe(getDocumentRefetchInterval.name, () => {
  it('does not poll before the documents have loaded', () => {
    expect(getDocumentRefetchInterval(undefined)).toBe(false);
  });

  it('does not poll when every document is uploaded', () => {
    expect(getDocumentRefetchInterval([makeAssetDocument()])).toBe(false);
  });

  it('polls while a document is being processed', () => {
    const documents = [
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
      }),
    ];

    expect(getDocumentRefetchInterval(documents)).toBe(DOCUMENT_PENDING_POLL_MS);
  });

  it('stops polling for a document whose upload never finished', () => {
    const documents = [
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.INCOMPLETE,
      }),
    ];

    expect(getDocumentRefetchInterval(documents)).toBe(false);
  });
});
