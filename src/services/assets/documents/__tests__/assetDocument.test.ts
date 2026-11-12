import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_INSTANCE_SPACE,
  DOCUMENT_PENDING_POLL_WINDOW_MS,
  DOCUMENT_QUERY_LIMIT,
} from '../../../../constants/documents';
import { DocumentOrigin } from '../../../../enums/documentOrigin';
import { DocumentUploadStatus } from '../../../../enums/documentUploadStatus';
import { TestPropertyType } from '../../../../enums/testPropertyType';
import { makeNodeInstance, makeQueryResponse, makeViewDefinition } from '../../../../mocks/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../../mocks/cogniteClient';
import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import {
  deleteAssetDocument,
  listAssetDocuments,
  listAssetLinkedFiles,
  uploadAssetDocument,
} from '../assetDocument';

const documentView = makeViewDefinition(
  'Document',
  {
    name: {},
    mimeType: {},
    isUploaded: {},
    uploadedTime: {},
    asset: { type: TestPropertyType.DIRECT },
  },
  'v1',
  'sp-asset-passport',
);
const documentReference = {
  type: 'view',
  space: 'sp-asset-passport',
  externalId: 'Document',
  version: 'v1',
};
const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(listAssetDocuments.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries the Document nodes linked to the asset', async () => {
    // Arrange
    stubModelViews(client, [documentView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ documents: [] }));

    // Act
    await listAssetDocuments(client, assetIdentifier);

    // Assert
    expect(query).toHaveBeenCalledWith({
      with: {
        documents: {
          nodes: {
            filter: {
              and: [
                { hasData: [documentReference] },
                {
                  equals: {
                    property: ['sp-asset-passport', 'Document/v1', 'asset'],
                    value: assetIdentifier,
                  },
                },
              ],
            },
          },
          sort: [
            {
              property: ['sp-asset-passport', 'Document/v1', 'uploadedTime'],
              direction: 'descending',
              nullsFirst: true,
            },
            {
              property: ['node', 'externalId'],
              direction: 'ascending',
              nullsFirst: false,
            },
          ],
          limit: DOCUMENT_QUERY_LIMIT + 1,
        },
      },
      select: {
        documents: {
          sources: [
            {
              source: documentReference,
              properties: ['name', 'mimeType', 'isUploaded', 'uploadedTime'],
            },
          ],
        },
      },
    });
  });

  it('maps nodes to documents, in the order the server sorted them', async () => {
    // Arrange
    stubModelViews(client, [documentView]);
    const older = {
      ...makeNodeInstance(
        documentView,
        { space: 'data', externalId: 'doc-1' },
        {
          name: 'manual.pdf',
          mimeType: 'application/pdf',
          isUploaded: true,
          uploadedTime: '2026-11-05T12:00:00.000+00:00',
        },
      ),
      createdTime: 1000,
    };
    const newer = {
      ...makeNodeInstance(
        documentView,
        { space: 'data', externalId: 'doc-2' },
        { name: 'drawing.png', isUploaded: false },
      ),
      createdTime: 2000,
    };
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ documents: [newer, older] }),
    );

    // Act
    const documents = await listAssetDocuments(client, assetIdentifier, DOCUMENT_QUERY_LIMIT, {
      now: () => 3000,
    });

    // Assert
    expect(documents.hasMore).toBe(false);
    expect(documents.items).toEqual([
      {
        space: 'data',
        externalId: 'doc-2',
        name: 'drawing.png',
        mimeType: null,
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
        origin: DocumentOrigin.APP,
        uploadedTime: null,
        createdTime: 2000,
      },
      {
        space: 'data',
        externalId: 'doc-1',
        name: 'manual.pdf',
        mimeType: 'application/pdf',
        isUploaded: true,
        uploadStatus: DocumentUploadStatus.UPLOADED,
        origin: DocumentOrigin.APP,
        uploadedTime: Date.parse('2026-11-05T12:00:00.000+00:00'),
        createdTime: 1000,
      },
    ]);
  });

  it('marks a document that never got marked uploaded as incomplete', async () => {
    stubModelViews(client, [documentView]);
    const stale = {
      ...makeNodeInstance(
        documentView,
        { space: 'data', externalId: 'doc-3' },
        { name: 'old.pdf', isUploaded: false },
      ),
      createdTime: 1000,
    };
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ documents: [stale] }),
    );

    const documents = await listAssetDocuments(client, assetIdentifier, DOCUMENT_QUERY_LIMIT, {
      now: () => 1000 + DOCUMENT_PENDING_POLL_WINDOW_MS + 1,
    });

    expect(documents.items[0]?.uploadStatus).toBe(DocumentUploadStatus.INCOMPLETE);
  });

  it('asks for one document more than the limit to learn whether more exist', async () => {
    stubModelViews(client, [documentView]);
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        documents: ['doc-1', 'doc-2', 'doc-3'].map((externalId) =>
          makeNodeInstance(documentView, { space: 'data', externalId }, {}),
        ),
      }),
    );

    const documents = await listAssetDocuments(client, assetIdentifier, 2);

    expect(query.mock.calls[0]?.[0].with.documents?.limit).toBe(3);
    expect(documents.hasMore).toBe(true);
    expect(documents.items.map((document) => document.externalId)).toEqual(['doc-1', 'doc-2']);
  });

  it('falls back to the external ID when a document has no name', async () => {
    stubModelViews(client, [documentView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        documents: [makeNodeInstance(documentView, { space: 'data', externalId: 'doc-3' }, {})],
      }),
    );

    const documents = await listAssetDocuments(client, assetIdentifier);

    expect(documents.items[0]?.name).toBe('doc-3');
  });

  it('fails when the Document view is not in the data model', async () => {
    stubModelViews(client, []);

    await expect(listAssetDocuments(client, assetIdentifier)).rejects.toThrow(
      'The Document view was not found in the Asset_Passport data model.',
    );
  });
});

const filesView = makeViewDefinition(
  'Files',
  {
    name: {},
    mimeType: {},
    isUploaded: {},
    uploadedTime: {},
    assets: { type: TestPropertyType.DIRECT },
  },
  'v1',
  'sp-dm-idi-rmdm',
);
const filesReference = {
  type: 'view',
  space: 'sp-dm-idi-rmdm',
  externalId: 'Files',
  version: 'v1',
};

describe(listAssetLinkedFiles.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries the Files nodes whose assets include the asset', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ files: [] }));

    await listAssetLinkedFiles(client, assetIdentifier);

    expect(query).toHaveBeenCalledWith({
      with: {
        files: {
          nodes: {
            filter: {
              and: [
                { hasData: [filesReference] },
                {
                  containsAny: {
                    property: ['sp-dm-idi-rmdm', 'Files/v1', 'assets'],
                    values: [assetIdentifier],
                  },
                },
              ],
            },
          },
          sort: [
            {
              property: ['sp-dm-idi-rmdm', 'Files/v1', 'uploadedTime'],
              direction: 'descending',
              nullsFirst: false,
            },
            {
              property: ['node', 'externalId'],
              direction: 'ascending',
              nullsFirst: false,
            },
          ],
          limit: DOCUMENT_QUERY_LIMIT + 1,
        },
      },
      select: {
        files: {
          sources: [
            {
              source: filesReference,
              properties: ['name', 'mimeType', 'isUploaded', 'uploadedTime'],
            },
          ],
        },
      },
    });
  });

  it('maps the files to read-only documents, in the order the server sorted them', async () => {
    const older = {
      ...makeNodeInstance(
        filesView,
        { space: 'rmdm-data', externalId: 'file-1' },
        {
          name: 'P&ID.pdf',
          mimeType: 'application/pdf',
          isUploaded: true,
          uploadedTime: '2026-11-05T12:00:00.000+00:00',
        },
      ),
      createdTime: 1000,
    };
    const newer = {
      ...makeNodeInstance(
        filesView,
        { space: 'rmdm-data', externalId: 'file-2' },
        { name: 'Datasheet.pdf', isUploaded: true },
      ),
      createdTime: 2000,
    };
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ files: [newer, older] }),
    );

    const files = await listAssetLinkedFiles(client, assetIdentifier, DOCUMENT_QUERY_LIMIT, {
      now: () => 3000,
    });

    expect(files.hasMore).toBe(false);
    expect(files.items).toEqual([
      {
        space: 'rmdm-data',
        externalId: 'file-2',
        name: 'Datasheet.pdf',
        mimeType: null,
        isUploaded: true,
        uploadStatus: DocumentUploadStatus.UPLOADED,
        origin: DocumentOrigin.RMDM,
        uploadedTime: null,
        createdTime: 2000,
      },
      {
        space: 'rmdm-data',
        externalId: 'file-1',
        name: 'P&ID.pdf',
        mimeType: 'application/pdf',
        isUploaded: true,
        uploadStatus: DocumentUploadStatus.UPLOADED,
        origin: DocumentOrigin.RMDM,
        uploadedTime: Date.parse('2026-11-05T12:00:00.000+00:00'),
        createdTime: 1000,
      },
    ]);
  });

  it('falls back to the external ID when a file has no name', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        files: [makeNodeInstance(filesView, { space: 'rmdm-data', externalId: 'file-3' }, {})],
      }),
    );

    const files = await listAssetLinkedFiles(client, assetIdentifier);

    expect(files.items[0]?.name).toBe('file-3');
  });

  it('asks for one file more than the limit to learn whether more exist', async () => {
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        files: ['file-1', 'file-2', 'file-3'].map((externalId) =>
          makeNodeInstance(filesView, { space: 'rmdm-data', externalId }, {}),
        ),
      }),
    );

    const files = await listAssetLinkedFiles(client, assetIdentifier, 2);

    expect(query.mock.calls[0]?.[0].with.files?.limit).toBe(3);
    expect(files.hasMore).toBe(true);
    expect(files.items.map((file) => file.externalId)).toEqual(['file-1', 'file-2']);
  });

  it('reads the RMDM view by reference, without the Asset_Passport data model', async () => {
    const retrieve = vi.spyOn(client.dataModels, 'retrieve');
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ files: [] }));

    await listAssetLinkedFiles(client, assetIdentifier);

    expect(retrieve).not.toHaveBeenCalled();
  });
});

describe(uploadAssetDocument.name, () => {
  let client: CogniteClient;
  let files: DocumentFileContextType;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [documentView]);
    files = {
      requestUploadUrl: vi.fn(() => Promise.resolve('https://upload.test/1')),
      uploadContent: vi.fn(() => Promise.resolve()),
    };
  });

  function makeFile(name = 'manual.pdf', type = 'application/pdf'): File {
    return new File(['content'], name, { type });
  }

  it('creates the node, requests an upload link and uploads the content', async () => {
    // Arrange
    const upsert = vi.spyOn(client.instances, 'upsert').mockResolvedValue({ items: [] });
    const file = makeFile();

    // Act
    await uploadAssetDocument(client, files, assetIdentifier, file, {
      generateId: () => 'abc',
    });

    // Assert
    expect(upsert).toHaveBeenCalledWith({
      items: [
        {
          instanceType: 'node',
          space: DOCUMENT_INSTANCE_SPACE,
          externalId: 'doc-abc',
          sources: [
            {
              source: documentReference,
              properties: {
                name: 'manual.pdf',
                mimeType: 'application/pdf',
                asset: assetIdentifier,
              },
            },
          ],
        },
      ],
      autoCreateDirectRelations: false,
      autoCreateStartNodes: false,
      autoCreateEndNodes: false,
    });
    expect(files.requestUploadUrl).toHaveBeenCalledWith({
      space: DOCUMENT_INSTANCE_SPACE,
      externalId: 'doc-abc',
    });
    expect(files.uploadContent).toHaveBeenCalledWith('https://upload.test/1', file);
  });

  it('uses a generic content type when the browser reports none', async () => {
    const upsert = vi.spyOn(client.instances, 'upsert').mockResolvedValue({ items: [] });

    await uploadAssetDocument(client, files, assetIdentifier, makeFile('notes.xyz', ''));

    expect(upsert.mock.calls[0][0].items[0].sources?.[0].properties).toEqual(
      expect.objectContaining({ mimeType: 'application/octet-stream' }),
    );
  });

  it('rejects an empty file without calling CDF', async () => {
    const upsert = vi.spyOn(client.instances, 'upsert');

    await expect(
      uploadAssetDocument(client, files, assetIdentifier, new File([], 'empty.pdf')),
    ).rejects.toThrow('The file is empty.');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('removes the node when the content upload fails', async () => {
    // Arrange
    vi.spyOn(client.instances, 'upsert').mockResolvedValue({ items: [] });
    const remove = vi.spyOn(client.instances, 'delete').mockResolvedValue({});
    vi.mocked(files.uploadContent).mockRejectedValue(new Error('storage down'));

    // Act & Assert
    await expect(
      uploadAssetDocument(client, files, assetIdentifier, makeFile(), {
        generateId: () => 'abc',
      }),
    ).rejects.toThrow('storage down');
    expect(remove).toHaveBeenCalledWith([
      {
        instanceType: 'node',
        space: DOCUMENT_INSTANCE_SPACE,
        externalId: 'doc-abc',
      },
    ]);
  });

  it('reports the original failure even if the cleanup also fails', async () => {
    vi.spyOn(client.instances, 'upsert').mockResolvedValue({ items: [] });
    vi.spyOn(client.instances, 'delete').mockRejectedValue(new Error('cleanup failed'));
    vi.mocked(files.requestUploadUrl).mockRejectedValue(new Error('no upload link'));

    await expect(uploadAssetDocument(client, files, assetIdentifier, makeFile())).rejects.toThrow(
      'no upload link',
    );
  });

  it('does not upload content when the node cannot be created', async () => {
    vi.spyOn(client.instances, 'upsert').mockRejectedValue(new Error('wrong asset'));

    await expect(uploadAssetDocument(client, files, assetIdentifier, makeFile())).rejects.toThrow(
      'wrong asset',
    );
    expect(files.uploadContent).not.toHaveBeenCalled();
  });
});

describe(deleteAssetDocument.name, () => {
  it('deletes the document node', async () => {
    // Arrange
    const client = makeOfflineSdkClient();
    const remove = vi.spyOn(client.instances, 'delete').mockResolvedValue({});

    // Act
    await deleteAssetDocument(client, {
      space: 'data',
      externalId: 'doc-1',
    });

    // Assert
    expect(remove).toHaveBeenCalledWith([
      { instanceType: 'node', space: 'data', externalId: 'doc-1' },
    ]);
  });

  it('propagates a failed delete', async () => {
    const client = makeOfflineSdkClient();
    vi.spyOn(client.instances, 'delete').mockRejectedValue(new Error('no access'));

    await expect(
      deleteAssetDocument(client, { space: 'data', externalId: 'doc-1' }),
    ).rejects.toThrow('no access');
  });
});
