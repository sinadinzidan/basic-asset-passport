import { describe, expect, it } from 'vitest';

import { DOCUMENT_MAX_FILE_SIZE_BYTES } from '../../constants/documents';
import { getDocumentFileProblem } from '../documentInput';

describe(getDocumentFileProblem.name, () => {
  it('accepts a file with content within the size limit', () => {
    expect(getDocumentFileProblem({ size: 1024 })).toBeNull();
  });

  it('accepts a file exactly at the size limit', () => {
    expect(getDocumentFileProblem({ size: DOCUMENT_MAX_FILE_SIZE_BYTES })).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(getDocumentFileProblem({ size: 0 })).toBe('The file is empty.');
  });

  it('rejects a file over the size limit', () => {
    expect(getDocumentFileProblem({ size: DOCUMENT_MAX_FILE_SIZE_BYTES + 1 })).toBe(
      'The file is larger than 50 MB.',
    );
  });
});
