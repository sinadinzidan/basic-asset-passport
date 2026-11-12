import type { CogniteClient } from '@cognite/sdk';

import { DEFAULT_DOCUMENT_MIME_TYPE } from '../../../constants/documents';
import { isRecord } from '../../../lib/isRecord';
import type { DocumentIdentifier } from '../../../types/document';
import type { DocumentFileContextType } from '../../../types/documentFileContext';

type DocumentFileSdk = Pick<CogniteClient, 'project' | 'post'>;

type DocumentFileDeps = { sendContent: typeof fetch };

const defaultDeps: DocumentFileDeps = {
  sendContent: (input, init) => fetch(input, init),
};

export function createDocumentFileContext(
  sdk: DocumentFileSdk,
  overrides?: Partial<DocumentFileDeps>,
): DocumentFileContextType {
  const { sendContent } = { ...defaultDeps, ...overrides };

  return {
    async requestUploadUrl(document: DocumentIdentifier): Promise<string> {
      const response = await sdk.post(`/api/v1/projects/${sdk.project}/files/uploadlink`, {
        data: { items: [{ instanceId: toInstanceId(document) }] },
      });
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
