import type { ViewDefinition } from '@cognite/sdk';

import { ASSET_PASSPORT_MODEL_EXTERNAL_ID } from '../../../constants/assets';
import {
  DEFAULT_DOCUMENT_MIME_TYPE,
  DOCUMENT_EXTERNAL_ID_PREFIX,
  DOCUMENT_INSTANCE_SPACE,
  DOCUMENT_QUERY_LIMIT,
  DOCUMENT_VIEW_EXTERNAL_ID,
  FILES_ASSETS_PROPERTY,
  FILES_VIEW_EXTERNAL_ID,
  FILES_VIEW_SPACE,
  FILES_VIEW_VERSION,
} from '../../../constants/documents';
import { DocumentOrigin } from '../../../enums/documentOrigin';
import { getDocumentFileProblem } from '../../../lib/documentInput';
import { getDocumentUploadStatus } from '../../../lib/documentUploadStatus';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetDataClient } from '../../../types/assetDataClient';
import type { AssetDocument, DocumentIdentifier } from '../../../types/document';
import type { DocumentFileClient } from '../../../types/documentFileClient';
import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
  type NodeInstance,
  type ViewIdentity,
} from '../viewHelpers';

/** The properties read from a document or file node. */
const DOCUMENT_PROPERTIES = ['name', 'mimeType', 'isUploaded', 'uploadedTime'];

type UploadDocumentDeps = { generateId: () => string; now: () => number };

const defaultDeps: UploadDocumentDeps = {
  generateId: () => crypto.randomUUID(),
  now: () => Date.now(),
};

/** Documents uploaded against an asset, newest first. */
export async function listAssetDocuments(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
  overrides?: Partial<Pick<UploadDocumentDeps, 'now'>>,
): Promise<AssetDocument[]> {
  const { now } = { ...defaultDeps, ...overrides };
  const currentTime = now();
  const documentView = await getDocumentView(client);
  const viewReference = toViewReference(documentView);
  const response = await client.instances.query({
    with: {
      documents: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              {
                equals: {
                  property: [
                    documentView.space,
                    `${documentView.externalId}/${documentView.version}`,
                    'asset',
                  ],
                  value: {
                    space: assetIdentifier.space,
                    externalId: assetIdentifier.externalId,
                  },
                },
              },
            ],
          },
        },
        limit: DOCUMENT_QUERY_LIMIT,
      },
    },
    select: {
      documents: {
        sources: [
          {
            source: viewReference,
            properties: DOCUMENT_PROPERTIES,
          },
        ],
      },
    },
  });

  return (response.items.documents ?? [])
    .filter(isNodeInstance)
    .map((node) =>
      toAssetDocument(node, documentView, DocumentOrigin.APP, currentTime),
    )
    .sort((first, second) => second.createdTime - first.createdTime);
}

const filesView: ViewIdentity = {
  space: FILES_VIEW_SPACE,
  externalId: FILES_VIEW_EXTERNAL_ID,
  version: FILES_VIEW_VERSION,
};

/**
 * The files that already exist in the domain model for the asset: the `Files`
 * nodes whose `assets` relation holds it, newest first. They are read only;
 * uploads go to the app's own Document view. The RMDM view is read by its
 * reference, not through the Asset_Passport data model.
 */
export async function listAssetLinkedFiles(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
  overrides?: Partial<Pick<UploadDocumentDeps, 'now'>>,
): Promise<AssetDocument[]> {
  const { now } = { ...defaultDeps, ...overrides };
  const currentTime = now();
  const viewReference = toViewReference(filesView);
  const response = await client.instances.query({
    with: {
      files: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              {
                containsAny: {
                  property: [
                    filesView.space,
                    `${filesView.externalId}/${filesView.version}`,
                    FILES_ASSETS_PROPERTY,
                  ],
                  values: [
                    {
                      space: assetIdentifier.space,
                      externalId: assetIdentifier.externalId,
                    },
                  ],
                },
              },
            ],
          },
        },
        limit: DOCUMENT_QUERY_LIMIT,
      },
    },
    select: {
      files: {
        sources: [
          {
            source: viewReference,
            properties: DOCUMENT_PROPERTIES,
          },
        ],
      },
    },
  });

  return (response.items.files ?? [])
    .filter(isNodeInstance)
    .map((node) =>
      toAssetDocument(node, filesView, DocumentOrigin.RMDM, currentTime),
    )
    .sort((first, second) => second.createdTime - first.createdTime);
}

function toAssetDocument(
  node: NodeInstance,
  view: ViewIdentity,
  origin: DocumentOrigin,
  currentTime: number,
): AssetDocument {
  const properties = getNodeViewProperties(node, view);
  const isUploaded = properties?.isUploaded === true;

  return {
    space: node.space,
    externalId: node.externalId,
    name: getStringProperty(properties, 'name') ?? node.externalId,
    mimeType: getStringProperty(properties, 'mimeType'),
    isUploaded,
    uploadStatus: getDocumentUploadStatus(
      { isUploaded, createdTime: node.createdTime },
      currentTime,
    ),
    origin,
    uploadedTime: getTimestampProperty(properties, 'uploadedTime'),
    createdTime: node.createdTime,
  };
}

/**
 * Creates the document node linked to the asset, then uploads the file
 * content to it. Missing target nodes are never auto-created. If the content
 * cannot be uploaded the node is removed again, so no empty documents remain.
 */
export async function uploadAssetDocument(
  client: AssetDataClient,
  files: DocumentFileClient,
  assetIdentifier: AssetIdentifier,
  file: File,
  overrides?: Partial<UploadDocumentDeps>,
): Promise<void> {
  const { generateId } = { ...defaultDeps, ...overrides };
  const problem = getDocumentFileProblem(file);
  if (problem) throw new Error(problem);

  const documentView = await getDocumentView(client);
  const document: DocumentIdentifier = {
    space: DOCUMENT_INSTANCE_SPACE,
    externalId: `${DOCUMENT_EXTERNAL_ID_PREFIX}${generateId()}`,
  };

  await client.instances.upsert({
    items: [
      {
        instanceType: 'node',
        space: document.space,
        externalId: document.externalId,
        sources: [
          {
            source: toViewReference(documentView),
            properties: {
              name: file.name,
              mimeType: file.type || DEFAULT_DOCUMENT_MIME_TYPE,
              asset: {
                space: assetIdentifier.space,
                externalId: assetIdentifier.externalId,
              },
            },
          },
        ],
      },
    ],
    autoCreateDirectRelations: false,
    autoCreateStartNodes: false,
    autoCreateEndNodes: false,
  });

  try {
    const uploadUrl = await files.requestUploadUrl(document);
    await files.uploadContent(uploadUrl, file);
  } catch (error) {
    await deleteAssetDocument(client, document).catch(() => undefined);
    throw error;
  }
}

/** Deleting the node also removes the file content. */
export async function deleteAssetDocument(
  client: AssetDataClient,
  document: DocumentIdentifier,
): Promise<void> {
  await client.instances.delete([
    {
      instanceType: 'node',
      space: document.space,
      externalId: document.externalId,
    },
  ]);
}

async function getDocumentView(
  client: AssetDataClient,
): Promise<ViewDefinition> {
  const views = await listAssetPassportViews(client);
  const documentView = views.find(
    (view) => view.externalId === DOCUMENT_VIEW_EXTERNAL_ID,
  );

  if (!documentView) {
    throw new Error(
      `The ${DOCUMENT_VIEW_EXTERNAL_ID} view was not found in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

  return documentView;
}

function getStringProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): string | null {
  const value = properties?.[propertyName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

/** CDF returns timestamps as ISO 8601 text; this is milliseconds since the epoch. */
function getTimestampProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): number | null {
  const value = getStringProperty(properties, propertyName);
  if (value === null) return null;

  const milliseconds = Date.parse(value);
  return Number.isNaN(milliseconds) ? null : milliseconds;
}
