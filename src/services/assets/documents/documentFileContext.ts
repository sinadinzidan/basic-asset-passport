import type { CogniteClient } from '@cognite/sdk';

import { DEFAULT_DOCUMENT_MIME_TYPE } from '../../../constants/documents';
import { isRecord } from '../../../lib/isRecord';
import type { DocumentIdentifier } from '../../../types/document';
import type { DocumentFileContextType } from '../../../types/documentFileContext';

type DocumentFileSdk = Pick<CogniteClient, 'project' | 'post'>;

type DocumentFileDeps = { sendContent: typeof fetch };

const UPLOAD_URL_KEY = 'uploadUrl';
const UPLOAD_LINK_MISSING_MESSAGE = 'CDF did not return an upload link.';

const defaultDeps: DocumentFileDeps = {
  sendContent: (input, init) => fetch(input, init),
};

class CdfDocumentFileContext implements DocumentFileContextType {
  constructor(
    private readonly sdk: DocumentFileSdk,
    private readonly deps: DocumentFileDeps,
  ) {}

  requestUploadUrl = async (document: DocumentIdentifier): Promise<string> => {
    const response = await this.sdk.post(`/api/v1/projects/${this.sdk.project}/files/uploadlink`, {
      data: { items: [{ instanceId: toInstanceId(document) }] },
    });
    const uploadUrl = readFirstItemString(response.data, UPLOAD_URL_KEY);
    if (uploadUrl === null) {
      throw new Error(UPLOAD_LINK_MISSING_MESSAGE);
    }

    return uploadUrl;
  };

  uploadContent = async (uploadUrl: string, file: File): Promise<void> => {
    const response = await this.deps.sendContent(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || DEFAULT_DOCUMENT_MIME_TYPE },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Uploading the file failed (${response.status}).`);
    }
  };
}

export function createDocumentFileContext(
  sdk: DocumentFileSdk,
  overrides?: Partial<DocumentFileDeps>,
): DocumentFileContextType {
  return new CdfDocumentFileContext(sdk, { ...defaultDeps, ...overrides });
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
