import { describe, expect, it } from 'vitest';

import { FileViewerType } from '../../enums/fileViewerType';
import { doesDocumentPreviewApiSupportFile, getComputedMimeType, getViewerType, inferMimeTypeFromUrl, isNativelySupportedMimeType } from '../mimeTypes';

describe('file MIME types', () => {
  it.each([
    ['https://files.test/diagram.PDF?token=test#page=1', 'application/pdf'],
    ['drawing.jpeg', 'image/jpeg'], ['drawing.png', 'image/png'], ['drawing.tif', 'image/tiff'],
    ['data.csv', 'text/csv'], ['data.json', 'application/json'], ['README', undefined], ['.hidden', undefined],
  ])('infers MIME type from %s', (name: string, expected: string | undefined) => {
    expect(inferMimeTypeFromUrl(name)).toBe(expected);
  });

  it('prefers MIME metadata and handles supported aliases', () => {
    expect(getComputedMimeType({ name: 'drawing.pdf', mimeType: 'image/jpg' })).toBe('image/jpeg');
    expect(getComputedMimeType({ name: 'drawing.pdf' })).toBe('application/pdf');
    expect(getComputedMimeType({})).toBeUndefined();
    expect(isNativelySupportedMimeType('application/pdf')).toBe(true);
    expect(isNativelySupportedMimeType(undefined)).toBe(false);
    expect(isNativelySupportedMimeType('application/octet-stream')).toBe(false);
  });

  it.each([
    ['application/pdf', FileViewerType.PDF], ['image/tif', FileViewerType.IMAGE], ['image/svg', FileViewerType.IMAGE], ['application/txt', FileViewerType.TEXT],
    ['application/msword', FileViewerType.PDF], ['application/octet-stream', FileViewerType.UNSUPPORTED], [undefined, FileViewerType.UNSUPPORTED],
  ])('selects a renderer for %s', (mimeType: string | undefined, expected: string) => {
    expect(getViewerType(mimeType)).toBe(expected);
  });

  it('recognizes Office conversion by extension or MIME type', () => {
    expect(doesDocumentPreviewApiSupportFile({ name: 'Report.DOCX' })).toBe(true);
    expect(doesDocumentPreviewApiSupportFile({ mimeType: 'application/msword' })).toBe(true);
    expect(doesDocumentPreviewApiSupportFile({ name: 'diagram.pdf' })).toBe(false);
    expect(doesDocumentPreviewApiSupportFile({})).toBe(false);
  });
});
