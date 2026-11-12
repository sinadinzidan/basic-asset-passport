import { describe, expect, it } from 'vitest';

import { makeAssetDocument } from '../../__mocks__/documents';
import { DOCUMENT_PENDING_POLL_MAX_MS, DOCUMENT_PENDING_POLL_MS } from '../../constants/documents';
import { DocumentUploadStatus } from '../../enums/documentUploadStatus';
import { getDocumentRefetchInterval } from '../documentPolling';

const CREATED_MS = Date.UTC(2026, 10, 5, 12);

describe(getDocumentRefetchInterval.name, () => {
  it('does not poll before the documents have loaded', () => {
    expect(getDocumentRefetchInterval(undefined, CREATED_MS)).toBe(false);
  });

  it('does not poll when every document is uploaded', () => {
    expect(getDocumentRefetchInterval([makeAssetDocument()], CREATED_MS)).toBe(false);
  });

  it('polls while a document is being processed', () => {
    const documents = [
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
      }),
    ];

    expect(getDocumentRefetchInterval(documents, CREATED_MS)).toBe(DOCUMENT_PENDING_POLL_MS);
  });

  it.each([
    [0, DOCUMENT_PENDING_POLL_MS],
    [9_000, DOCUMENT_PENDING_POLL_MS],
    [10_000, DOCUMENT_PENDING_POLL_MS * 2],
    [25_000, DOCUMENT_PENDING_POLL_MS * 4],
    [30_000, DOCUMENT_PENDING_POLL_MAX_MS],
    [110_000, DOCUMENT_PENDING_POLL_MAX_MS],
  ])('polls less often the longer the document has been processing (%i ms)', (ageMs, interval) => {
    const documents = [
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
        createdTime: CREATED_MS,
      }),
    ];

    expect(getDocumentRefetchInterval(documents, CREATED_MS + ageMs)).toBe(interval);
  });

  it('follows the newest document that is still processing', () => {
    const processing = { isUploaded: false, uploadStatus: DocumentUploadStatus.PROCESSING };
    const documents = [
      makeAssetDocument({ ...processing, externalId: 'old', createdTime: CREATED_MS }),
      makeAssetDocument({ ...processing, externalId: 'new', createdTime: CREATED_MS + 60_000 }),
    ];

    expect(getDocumentRefetchInterval(documents, CREATED_MS + 61_000)).toBe(
      DOCUMENT_PENDING_POLL_MS,
    );
  });

  it('stops polling for a document whose upload never finished', () => {
    const documents = [
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.INCOMPLETE,
      }),
    ];

    expect(getDocumentRefetchInterval(documents, CREATED_MS)).toBe(false);
  });
});
