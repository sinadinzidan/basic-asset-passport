import { describe, expect, it } from 'vitest';

import { formatFileMeta, repeatsName } from '../fileMeta';

describe('formatFileMeta', () => {
  it('joins id, revision, date and origin', () => {
    expect(formatFileMeta({ name: 'Plant P&ID', id: 'DOC-1', revision: 'B', date: '2026-01-02', origin: 'Equipment file' })).toBe('DOC-1 · Rev B · 2026-01-02 · Equipment file');
  });

  it('shows the same dash for a missing revision or date, and leaves out an unknown origin', () => {
    expect(formatFileMeta({ name: 'Plant P&ID', id: 'DOC-1' })).toBe('DOC-1 · Rev — · —');
  });

  it('leaves out the id when it only repeats the name, which the row already shows', () => {
    expect(formatFileMeta({ name: 'PH-ME-P-0003-001.pdf', id: 'PH-ME-P-0003-001.pdf', date: '2026-06-12', origin: 'Equipment file' })).toBe('Rev — · 2026-06-12 · Equipment file');
  });
});

describe('repeatsName', () => {
  it('ignores case and surrounding spaces', () => {
    expect(repeatsName('  ph-me-p-0003-001.PDF ', 'PH-ME-P-0003-001.pdf')).toBe(true);
  });

  it('is false for a different or missing value', () => {
    expect(repeatsName('Main lube oil pump drawing', 'PH-ME-P-0003-001.pdf')).toBe(false);
    expect(repeatsName('PH-ME-P-0003-001.pdf (rev 2)', 'PH-ME-P-0003-001.pdf')).toBe(false);
    expect(repeatsName(undefined, 'PH-ME-P-0003-001.pdf')).toBe(false);
  });
});
