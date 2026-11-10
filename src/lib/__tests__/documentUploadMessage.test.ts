import { describe, expect, it } from 'vitest';

import { formatDocumentsUploadedMessage } from '../documentUploadMessage';

describe(formatDocumentsUploadedMessage.name, () => {
  it('uses the singular for one document', () => {
    expect(formatDocumentsUploadedMessage(1)).toBe('1 document uploaded.');
  });

  it('uses the plural for several documents', () => {
    expect(formatDocumentsUploadedMessage(3)).toBe('3 documents uploaded.');
  });
});
