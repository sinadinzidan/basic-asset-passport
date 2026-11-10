import { describe, expect, it } from 'vitest';

import { DocumentKind } from '../../enums/documentKind';
import { formatDocumentType, getDocumentKind } from '../documentType';

describe(formatDocumentType.name, () => {
  it.each([
    ['application/pdf', 'PDF'],
    ['image/png', 'PNG'],
    ['image/jpeg', 'JPEG'],
    ['text/plain', 'Text'],
    ['text/csv', 'CSV'],
    ['application/msword', 'Word'],
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Word',
    ],
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Excel',
    ],
  ])('names %s as %s', (mimeType, label) => {
    expect(formatDocumentType(mimeType)).toBe(label);
  });

  it('is case-insensitive and ignores parameters', () => {
    expect(formatDocumentType('Application/PDF; charset=binary')).toBe('PDF');
  });

  it('falls back to a generic label for unknown or missing types', () => {
    expect(formatDocumentType('application/x-unknown')).toBe('File');
    expect(formatDocumentType(null)).toBe('File');
  });
});

describe(getDocumentKind.name, () => {
  it.each([
    ['application/pdf', DocumentKind.PDF],
    ['image/png', DocumentKind.IMAGE],
    ['image/jpeg', DocumentKind.IMAGE],
    ['image/svg+xml', DocumentKind.IMAGE],
    ['text/csv', DocumentKind.SPREADSHEET],
    ['application/vnd.ms-excel', DocumentKind.SPREADSHEET],
    [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      DocumentKind.SPREADSHEET,
    ],
    ['text/plain', DocumentKind.DOCUMENT],
    ['application/msword', DocumentKind.DOCUMENT],
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      DocumentKind.DOCUMENT,
    ],
    ['application/vnd.ms-powerpoint', DocumentKind.PRESENTATION],
    ['application/json', DocumentKind.DATA],
  ])('classifies %s as %s', (mimeType, kind) => {
    expect(getDocumentKind(mimeType)).toBe(kind);
  });

  it('is case-insensitive and ignores parameters', () => {
    expect(getDocumentKind('Image/PNG; charset=binary')).toBe(
      DocumentKind.IMAGE,
    );
  });

  it('treats unknown or missing types as a generic file', () => {
    expect(getDocumentKind('application/x-unknown')).toBe(DocumentKind.FILE);
    expect(getDocumentKind(null)).toBe(DocumentKind.FILE);
  });
});
