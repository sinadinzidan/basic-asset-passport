import { describe, expect, it } from 'vitest';

import { DOCUMENT_PENDING_POLL_WINDOW_MS } from '../../constants/documents';
import { DocumentUploadStatus } from '../../enums/documentUploadStatus';
import { getDocumentUploadStatus } from '../documentUploadStatus';

const NOW = 1_800_000_000_000;

describe(getDocumentUploadStatus.name, () => {
  it('is uploaded once CDF marks the file as uploaded', () => {
    const status = getDocumentUploadStatus(
      {
        isUploaded: true,
        createdTime: NOW - 10 * DOCUMENT_PENDING_POLL_WINDOW_MS,
      },
      NOW,
    );

    expect(status).toBe(DocumentUploadStatus.UPLOADED);
  });

  it('is processing while a young document is not marked uploaded', () => {
    const status = getDocumentUploadStatus({ isUploaded: false, createdTime: NOW - 1_000 }, NOW);

    expect(status).toBe(DocumentUploadStatus.PROCESSING);
  });

  it('is incomplete once the processing window has passed', () => {
    const status = getDocumentUploadStatus(
      {
        isUploaded: false,
        createdTime: NOW - DOCUMENT_PENDING_POLL_WINDOW_MS - 1,
      },
      NOW,
    );

    expect(status).toBe(DocumentUploadStatus.INCOMPLETE);
  });
});
