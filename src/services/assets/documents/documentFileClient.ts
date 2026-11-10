import type { CogniteClient } from '@cognite/sdk';

import { DEFAULT_DOCUMENT_MIME_TYPE } from '../../../constants/documents';
import type { DocumentIdentifier } from '../../../types/document';
import type { DocumentFileClient } from '../../../types/documentFileClient';

type DocumentFileSdk = Pick<CogniteClient, 'project' | 'post'>;

type DocumentFileDeps = { sendContent: typeof fetch };

const defaultDeps: DocumentFileDeps = {
  sendContent: (input, init) => fetch(input, init),
};

/**
 * Adapts the SDK to the file upload the documents need. Upload links are
 * requested through the authenticated SDK; the content itself goes straight to
 * the temporary link with no CDF token. That link points at a `cognitedata.com`
 * host, which the baseline Content Security Policy already allows; a storage
 * host outside `cognitedata.com` would need `permissions.network` in
 * `manifest.json`.
 */
export function createDocumentFileClient(
  sdk: DocumentFileSdk,
  overrides?: Partial<DocumentFileDeps>,
): DocumentFileClient {
  const { sendContent } = { ...defaultDeps, ...overrides };

  return {
    async requestUploadUrl(document: DocumentIdentifier): Promise<string> {
      const response = await sdk.post(
        `/api/v1/projects/${sdk.project}/files/uploadlink`,
        { data: { items: [{ instanceId: toInstanceId(document) }] } },
      );
      const uploadUrl = readFirstItemString(response.data, 'uploadUrl');
      if (uploadUrl === null) {
        throw new Error('CDF did not return an upload link.');
      }

      return uploadUrl;
    },

    async uploadContent(uploadUrl: string, file: File): Promise<void> {
      const response = await sendContent(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || DEFAULT_DOCUMENT_MIME_TYPE },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Uploading the file failed (${response.status}).`);
      }
    },

  };
}

function toInstanceId(document: DocumentIdentifier): DocumentIdentifier {
  return { space: document.space, externalId: document.externalId };
}

function readFirstItemString(data: unknown, key: string): string | null {
  if (!isRecord(data) || !Array.isArray(data.items)) return null;

  const [item]: unknown[] = data.items;
  if (!isRecord(item)) return null;

  const value = item[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
