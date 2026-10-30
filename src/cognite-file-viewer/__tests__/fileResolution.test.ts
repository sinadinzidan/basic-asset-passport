import { CogniteClient } from '@cognite/sdk';
import type { FileInfo } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearAllFileCache, clearFileCache, resolveFileDownloadConfig } from '../fileResolution';

afterEach(() => {
  clearAllFileCache();
  vi.restoreAllMocks();
});

describe('resolveFileDownloadConfig', () => {
  it('uses the authenticated download endpoint for PDFs and caches only within the project', async () => {
    const client = createClient('first');
    const post = vi.spyOn(client, 'post').mockResolvedValue({
      status: 200, headers: {}, data: { items: [{ downloadUrl: 'https://files.test/PID.pdf' }] },
    });
    const file = createFile();
    const expected = { url: 'https://files.test/PID.pdf', mimeType: 'application/pdf' };
    expect(await resolveFileDownloadConfig(client, file)).toEqual(expected);
    expect(await resolveFileDownloadConfig(client, file)).toEqual(expected);
    expect(post).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith('/api/v1/projects/first/files/downloadlink', {
      data: { items: [{ id: 123 }] }, params: { extendedExpiration: true },
    });
    clearFileCache(123, 'first');
    await resolveFileDownloadConfig(client, file);
    expect(post).toHaveBeenCalledTimes(2);
    const second = createClient('second');
    const secondPost = vi.spyOn(second, 'post').mockResolvedValue({
      status: 200, headers: {}, data: { items: [{ downloadUrl: 'https://files.test/other.pdf' }] },
    });
    expect(await resolveFileDownloadConfig(second, file)).toHaveProperty('url', 'https://files.test/other.pdf');
    expect(secondPost).toHaveBeenCalledOnce();
  });

  it('converts Office documents through CDF document preview', async () => {
    const client = createClient('test');
    const preview = vi.spyOn(client.documents.preview, 'pdfTemporaryLink').mockResolvedValue({
      temporaryLink: 'https://files.test/converted.pdf',
      expirationTime: 0,
    });
    expect(await resolveFileDownloadConfig(client, {
      ...createFile(), name: 'Manual.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })).toEqual({ url: 'https://files.test/converted.pdf', mimeType: 'application/pdf' });
    expect(preview).toHaveBeenCalledWith(123);
  });

  it('reports unsupported types, missing download links and permission failures', async () => {
    const client = createClient('test');
    await expect(resolveFileDownloadConfig(client, { ...createFile(), name: 'Model.bin', mimeType: 'application/octet-stream' }))
      .rejects.toThrow('Unsupported file type');
    const post = vi.spyOn(client, 'post').mockResolvedValue({ status: 200, headers: {}, data: { items: [] } });
    await expect(resolveFileDownloadConfig(client, createFile())).rejects.toThrow('No download URL');
    post.mockRejectedValue(new Error('Forbidden'));
    await expect(resolveFileDownloadConfig(client, createFile())).rejects.toThrow('Forbidden');
  });
});

function createClient(project: string): CogniteClient {
  return new CogniteClient({ appId: 'test', project, oidcTokenProvider: async () => 'test' });
}

function createFile(): FileInfo {
  return { id: 123, name: 'PID.pdf', mimeType: 'application/pdf', uploaded: true, createdTime: new Date(0), lastUpdatedTime: new Date(0) };
}
