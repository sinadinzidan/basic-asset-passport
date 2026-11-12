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
import { getRequestLimit, toLimitedList } from '../../../lib/limitedList';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { AssetDocument, DocumentIdentifier } from '../../../types/document';
import type { DocumentFileContextType } from '../../../types/documentFileContext';
import type { LimitedList } from '../../../types/list';
import { SORT_BY_EXTERNAL_ID, sortByViewProperty } from '../querySort';
import {
  findAssetPassportView,
  getNodeViewProperties,
  getStringProperty,
  isNodeInstance,
  toViewReference,
  type NodeInstance,
  type ViewIdentity,
} from '../viewHelpers';

const DOCUMENT_PROPERTIES = ['name', 'mimeType', 'isUploaded', 'uploadedTime'];
const UPLOADED_TIME_PROPERTY = 'uploadedTime';

type UploadDocumentDeps = { generateId: () => string; now: () => number };

const defaultDeps: UploadDocumentDeps = {
  generateId: () => crypto.randomUUID(),
  now: () => Date.now(),
};

export async function listAssetDocuments(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
  overrides?: Partial<Pick<UploadDocumentDeps, 'now'>>,
): Promise<LimitedList<AssetDocument>> {
  const { now } = { ...defaultDeps, ...overrides };
  const currentTime = now();
  const documentView = await findAssetPassportView(client, DOCUMENT_VIEW_EXTERNAL_ID);
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
        sort: [
          sortByViewProperty(documentView, UPLOADED_TIME_PROPERTY, {
            direction: 'descending',
            nullsFirst: true,
          }),
          SORT_BY_EXTERNAL_ID,
        ],
        limit: getRequestLimit(limit),
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

  return toLimitedList(
    (response.items.documents ?? [])
      .filter(isNodeInstance)
      .map((node) => toAssetDocument(node, documentView, DocumentOrigin.APP, currentTime)),
    limit,
  );
}

const filesView: ViewIdentity = {
  space: FILES_VIEW_SPACE,
  externalId: FILES_VIEW_EXTERNAL_ID,
  version: FILES_VIEW_VERSION,
};

export async function listAssetLinkedFiles(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
  overrides?: Partial<Pick<UploadDocumentDeps, 'now'>>,
): Promise<LimitedList<AssetDocument>> {
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
        sort: [
          sortByViewProperty(filesView, UPLOADED_TIME_PROPERTY, {
            direction: 'descending',
            nullsFirst: false,
          }),
          SORT_BY_EXTERNAL_ID,
        ],
        limit: getRequestLimit(limit),
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

  return toLimitedList(
    (response.items.files ?? [])
      .filter(isNodeInstance)
      .map((node) => toAssetDocument(node, filesView, DocumentOrigin.RMDM, currentTime)),
    limit,
  );
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

export async function uploadAssetDocument(
  client: AssetContextType,
  files: DocumentFileContextType,
  assetIdentifier: AssetIdentifier,
  file: File,
  overrides?: Partial<UploadDocumentDeps>,
): Promise<void> {
  const { generateId } = { ...defaultDeps, ...overrides };
  const problem = getDocumentFileProblem(file);
  if (problem) throw new Error(problem);

  const documentView = await findAssetPassportView(client, DOCUMENT_VIEW_EXTERNAL_ID);
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

export async function deleteAssetDocument(
  client: AssetContextType,
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

function getTimestampProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): number | null {
  const value = getStringProperty(properties, propertyName);
  if (value === null) return null;

  const milliseconds = Date.parse(value);
  return Number.isNaN(milliseconds) ? null : milliseconds;
}
