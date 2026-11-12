import { describe, expect, it } from 'vitest';

import {
  doesDocumentPreviewApiSupportFile,
  getComputedMimeType,
  getViewerType,
  inferMimeTypeFromUrl,
  isNativelySupportedMimeType,
} from '../mimeTypes';

const WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('isNativelySupportedMimeType', () => {
  it.each([['application/pdf'], ['image/png'], ['image/jpeg'], ['text/plain'], ['application/json']])(
    'accepts %s',
    (mimeType) => {
      expect(isNativelySupportedMimeType(mimeType)).toBe(true);
    },
  );

  it.each([[WORD], ['video/mp4'], [''], [null], [undefined]])('rejects %j', (mimeType) => {
    expect(isNativelySupportedMimeType(mimeType)).toBe(false);
  });
});

describe('doesDocumentPreviewApiSupportFile', () => {
  it('accepts an Office document by its MIME type', () => {
    expect(doesDocumentPreviewApiSupportFile({ mimeType: WORD })).toBe(true);
  });

  it('accepts an Office document by its file extension when the MIME type is unknown', () => {
    expect(doesDocumentPreviewApiSupportFile({ mimeType: null, name: 'Report.DOCX' })).toBe(true);
  });

  it('rejects a file it cannot convert', () => {
    expect(doesDocumentPreviewApiSupportFile({ mimeType: 'video/mp4', name: 'clip.mp4' })).toBe(
      false,
    );
    expect(doesDocumentPreviewApiSupportFile({})).toBe(false);
  });
});

describe('inferMimeTypeFromUrl', () => {
  it.each([
    ['manual.pdf', 'application/pdf'],
    ['photo.JPG', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['scan.tif', 'image/tiff'],
    ['data.csv', 'text/csv'],
    ['https://files.test/a/b/drawing.svg', 'image/svg+xml'],
  ])('reads %s as %s', (name, mimeType) => {
    expect(inferMimeTypeFromUrl(name)).toBe(mimeType);
  });

  it('knows nothing about an unknown or missing extension', () => {
    expect(inferMimeTypeFromUrl('archive.zip')).toBeUndefined();
    expect(inferMimeTypeFromUrl('README')).toBeUndefined();
  });
});

describe('getComputedMimeType', () => {
  it('prefers the MIME type of the file, in its canonical form', () => {
    expect(getComputedMimeType({ mimeType: 'image/jpg', name: 'x.pdf' })).toBe('image/jpeg');
    expect(getComputedMimeType({ mimeType: 'image/tif' })).toBe('image/tiff');
    expect(getComputedMimeType({ mimeType: 'image/svg' })).toBe('image/svg+xml');
    expect(getComputedMimeType({ mimeType: 'application/txt' })).toBe('text/plain');
    expect(getComputedMimeType({ mimeType: 'application/pdf' })).toBe('application/pdf');
  });

  it('falls back to the file name', () => {
    expect(getComputedMimeType({ mimeType: null, name: 'manual.pdf' })).toBe('application/pdf');
  });

  it('is undefined when neither says anything', () => {
    expect(getComputedMimeType({})).toBeUndefined();
    expect(getComputedMimeType({ name: 'README' })).toBeUndefined();
  });
});

describe('getViewerType', () => {
  it.each([
    ['application/pdf', 'pdf'],
    ['image/png', 'image'],
    ['image/jpg', 'image'],
    ['text/csv', 'text'],
    [WORD, 'pdf'],
    ['video/mp4', 'unsupported'],
    [undefined, 'unsupported'],
  ])('shows %s with the %s viewer', (mimeType, viewer) => {
    expect(getViewerType(mimeType)).toBe(viewer);
  });
});
