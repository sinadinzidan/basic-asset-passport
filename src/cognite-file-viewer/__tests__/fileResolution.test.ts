import type { CogniteClient, FileInfo } from '@cognite/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../__mocks__/cogniteClient';
import { clearAllFileCache, clearFileCache, resolveFileDownloadConfig } from '../fileResolution';

function makeFile(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    id: 7,
    name: 'manual.pdf',
    mimeType: 'application/pdf',
    uploaded: true,
    createdTime: new Date(0),
    lastUpdatedTime: new Date(0),
    ...overrides,
  };
}

function linkResponse(downloadUrl?: string) {
  return { data: { items: downloadUrl ? [{ downloadUrl }] : [] }, status: 200, headers: {} };
}

describe('resolveFileDownloadConfig', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
    clearAllFileCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks for a long-lived download link for a file the browser can show', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));

    await expect(resolveFileDownloadConfig(client, makeFile())).resolves.toEqual({
      url: 'https://files.test/7',
      mimeType: 'application/pdf',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/projects/my-project/files/downloadlink', {
      data: { items: [{ id: 7 }] },
      params: { extendedExpiration: true },
    });
  });

  it('reads the type from the file name when the file has no MIME type', async () => {
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));

    const resolved = await resolveFileDownloadConfig(
      client,
      makeFile({ mimeType: undefined, name: 'photo.png' }),
    );

    expect(resolved.mimeType).toBe('image/png');
  });

  it('converts an Office document to PDF through the preview API', async () => {
    const pdfTemporaryLink = vi
      .spyOn(client.documents.preview, 'pdfTemporaryLink')
      .mockResolvedValue({ temporaryLink: 'https://preview.test/7', expirationTime: 0 });
    const post = vi.spyOn(client, 'post');

    await expect(
      resolveFileDownloadConfig(
        client,
        makeFile({ name: 'report.docx', mimeType: 'application/msword' }),
      ),
    ).resolves.toEqual({ url: 'https://preview.test/7', mimeType: 'application/pdf' });
    expect(pdfTemporaryLink).toHaveBeenCalledWith(7);
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects a file it cannot show, naming it', async () => {
    await expect(
      resolveFileDownloadConfig(client, makeFile({ name: 'clip.mp4', mimeType: 'video/mp4' })),
    ).rejects.toThrow('Unsupported file type (id: 7, name: clip.mp4, mimeType: video/mp4)');
  });

  it('fails when CDF returns no download link', async () => {
    vi.spyOn(client, 'post').mockResolvedValue(linkResponse());

    await expect(resolveFileDownloadConfig(client, makeFile())).rejects.toThrow(
      'No download URL for file 7',
    );
  });

  it('reuses the link of a file it resolved before', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));

    await resolveFileDownloadConfig(client, makeFile());
    await resolveFileDownloadConfig(client, makeFile());

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('keeps the links of two projects apart', async () => {
    const other = makeOfflineSdkClient('other-project');
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));
    const otherPost = vi
      .spyOn(other, 'post')
      .mockResolvedValue(linkResponse('https://other.test/7'));

    await resolveFileDownloadConfig(client, makeFile());
    const resolved = await resolveFileDownloadConfig(other, makeFile());

    expect(resolved.url).toBe('https://other.test/7');
    expect(post).toHaveBeenCalledTimes(1);
    expect(otherPost).toHaveBeenCalledTimes(1);
  });

  it('asks again once the cached link has expired', async () => {
    vi.useFakeTimers();
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));
    await resolveFileDownloadConfig(client, makeFile());

    vi.advanceTimersByTime(60 * 60 * 1000);
    await resolveFileDownloadConfig(client, makeFile());

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('asks again after the cache entry of that file is cleared', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/7'));
    await resolveFileDownloadConfig(client, makeFile());

    clearFileCache(7, 'my-project');
    await resolveFileDownloadConfig(client, makeFile());

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('leaves the entries of other files when one is cleared', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/x'));
    await resolveFileDownloadConfig(client, makeFile());

    clearFileCache(8, 'my-project');
    clearFileCache(7);
    await resolveFileDownloadConfig(client, makeFile());

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('drops the oldest links once it holds more than it keeps', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue(linkResponse('https://files.test/x'));
    for (let id = 1; id <= 201; id += 1) {
      await resolveFileDownloadConfig(client, makeFile({ id }));
    }
    post.mockClear();

    await resolveFileDownloadConfig(client, makeFile({ id: 201 }));
    expect(post).not.toHaveBeenCalled();

    await resolveFileDownloadConfig(client, makeFile({ id: 1 }));
    expect(post).toHaveBeenCalledTimes(1);
  });
});
