import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../../../__mocks__/cogniteClient';
import { createDocumentFileContext } from '../documentFileContext';

const document = { space: 'data', externalId: 'doc-1' };

describe(createDocumentFileContext.name, () => {
  let sdk: CogniteClient;

  beforeEach(() => {
    sdk = makeOfflineSdkClient('my-project');
  });

  describe('requestUploadUrl', () => {
    it('asks the Files API for an upload link by instance ID', async () => {
      // Arrange
      const post = vi.spyOn(sdk, 'post').mockResolvedValue({
        data: { items: [{ uploadUrl: 'https://upload.test/1' }] },
        status: 201,
        headers: {},
      });
      const client = createDocumentFileContext(sdk);

      // Act
      const uploadUrl = await client.requestUploadUrl(document);

      // Assert
      expect(uploadUrl).toBe('https://upload.test/1');
      expect(post).toHaveBeenCalledWith('/api/v1/projects/my-project/files/uploadlink', {
        data: { items: [{ instanceId: document }] },
      });
    });

    it('fails when the response has no upload link', async () => {
      vi.spyOn(sdk, 'post').mockResolvedValue({
        data: { items: [{}] },
        status: 201,
        headers: {},
      });

      await expect(createDocumentFileContext(sdk).requestUploadUrl(document)).rejects.toThrow(
        'CDF did not return an upload link.',
      );
    });

    it('propagates a rejected request', async () => {
      vi.spyOn(sdk, 'post').mockRejectedValue(new Error('forbidden'));

      await expect(createDocumentFileContext(sdk).requestUploadUrl(document)).rejects.toThrow(
        'forbidden',
      );
    });
  });

  describe('uploadContent', () => {
    const file = new File(['content'], 'manual.pdf', {
      type: 'application/pdf',
    });

    it('sends the file with a PUT and its content type', async () => {
      // Arrange
      const sendContent = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
      const client = createDocumentFileContext(sdk, { sendContent });

      // Act
      await client.uploadContent('https://upload.test/1', file);

      // Assert
      expect(sendContent).toHaveBeenCalledWith('https://upload.test/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });
    });

    it('uses a generic content type when the file has none', async () => {
      const sendContent = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));

      await createDocumentFileContext(sdk, { sendContent }).uploadContent(
        'https://upload.test/1',
        new File(['content'], 'notes.xyz'),
      );

      expect(sendContent).toHaveBeenCalledWith(
        'https://upload.test/1',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/octet-stream' },
        }),
      );
    });

    it('fails when the storage service refuses the upload', async () => {
      const sendContent = vi.fn(() => Promise.resolve(new Response(null, { status: 403 })));

      await expect(
        createDocumentFileContext(sdk, { sendContent }).uploadContent(
          'https://upload.test/1',
          file,
        ),
      ).rejects.toThrow('Uploading the file failed (403).');
    });
  });
});
