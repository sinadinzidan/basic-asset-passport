import type { CogniteClient } from '@cognite/sdk';

import { DEFAULT_DOCUMENT_MIME_TYPE } from '../../../constants/documents';
import { UploadLinkResponseSchema } from '../../../schemas/document';
import type { DocumentIdentifier } from '../../../types/document';
import type { DocumentFileContextType } from '../../../types/documentFileContext';

type DocumentFileSdk = Pick<CogniteClient, 'project' | 'post'>;

type DocumentFileDeps = { sendContent: typeof fetch };

const UPLOAD_LINK_MISSING_MESSAGE = 'CDF did not return an upload link.';

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
      const parsed = UploadLinkResponseSchema.safeParse(response.data);
      if (!parsed.success) {
        throw new Error(UPLOAD_LINK_MISSING_MESSAGE);
      }

      return parsed.data.items[0].uploadUrl;
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
