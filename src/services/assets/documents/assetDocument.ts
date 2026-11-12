import type { FilterDefinition } from '@cognite/sdk';

import { MODEL } from '../../../config/model';
import { DESCENDING_SORT_DIRECTION, INSTANCE_TYPE_NODE } from '../../../constants/cdfApi';
import {
  DEFAULT_DOCUMENT_MIME_TYPE,
  DOCUMENT_EXTERNAL_ID_PREFIX,
  DOCUMENT_QUERY_LIMIT,
} from '../../../constants/documents';
import { DocumentOrigin } from '../../../enums/documentOrigin';
import { getDocumentFileProblem } from '../../../lib/documentInput';
import { getDocumentUploadStatus } from '../../../lib/documentUploadStatus';
import { getRequestLimit, toLimitedList } from '../../../lib/limitedList';
import { DocumentPropertiesSchema } from '../../../schemas/document';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { AssetDocument, DocumentIdentifier } from '../../../types/document';
import type { DocumentFileContextType } from '../../../types/documentFileContext';
import type { LimitedList } from '../../../types/list';
import { matchAssetInList, matchAssetRelation } from '../assetFilter';
import { SORT_BY_EXTERNAL_ID, sortByViewProperty } from '../querySort';
import {
  findAssetPassportView,
  getNodeViewProperties,
  isNodeInstance,
  toViewReference,
  type NodeInstance,
  type ViewIdentity,
} from '../viewHelpers';

const UPLOADED_TIME_PROPERTY = MODEL.properties.document.uploadedTime;
const DOCUMENT_PROPERTIES = Object.values(MODEL.properties.document);
const DOCUMENTS_RESULT_SET = 'documents';
const FILES_RESULT_SET = 'files';

type DocumentListSource = {
  resultSetName: string;
  view: ViewIdentity;
  assetFilter: FilterDefinition;
  origin: DocumentOrigin;
  nullsFirst: boolean;
};

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
  const documentView = await findAssetPassportView(client, MODEL.views.document);

  return listDocumentNodes(
    client,
    {
      resultSetName: DOCUMENTS_RESULT_SET,
      view: documentView,
      assetFilter: matchAssetRelation(documentView, assetIdentifier),
      origin: DocumentOrigin.APP,
      nullsFirst: true,
    },
    limit,
    currentTime,
  );
}

export function listAssetLinkedFiles(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = DOCUMENT_QUERY_LIMIT,
  overrides?: Partial<Pick<UploadDocumentDeps, 'now'>>,
): Promise<LimitedList<AssetDocument>> {
  const { now } = { ...defaultDeps, ...overrides };

  return listDocumentNodes(
    client,
    {
      resultSetName: FILES_RESULT_SET,
      view: MODEL.filesView,
      assetFilter: matchAssetInList(
        MODEL.filesView,
        MODEL.properties.files.assets,
        assetIdentifier,
      ),
      origin: DocumentOrigin.RMDM,
      nullsFirst: false,
    },
    limit,
    now(),
  );
}

async function listDocumentNodes(
  client: AssetContextType,
  { resultSetName, view, assetFilter, origin, nullsFirst }: DocumentListSource,
  limit: number,
  currentTime: number,
): Promise<LimitedList<AssetDocument>> {
  const viewReference = toViewReference(view);
  const response = await client.instances.query({
    with: {
      [resultSetName]: {
        nodes: { filter: { and: [{ hasData: [viewReference] }, assetFilter] } },
        sort: [
          sortByViewProperty(view, UPLOADED_TIME_PROPERTY, {
            direction: DESCENDING_SORT_DIRECTION,
            nullsFirst,
          }),
          SORT_BY_EXTERNAL_ID,
        ],
        limit: getRequestLimit(limit),
      },
    },
    select: {
      [resultSetName]: {
        sources: [{ source: viewReference, properties: DOCUMENT_PROPERTIES }],
      },
    },
  });

  return toLimitedList(
    (response.items[resultSetName] ?? [])
      .filter(isNodeInstance)
      .map((node) => toAssetDocument(node, view, origin, currentTime)),
    limit,
  );
}

function toAssetDocument(
  node: NodeInstance,
  view: ViewIdentity,
  origin: DocumentOrigin,
  currentTime: number,
): AssetDocument {
  const { name, mimeType, isUploaded, uploadedTime } = DocumentPropertiesSchema.parse(
    getNodeViewProperties(node, view) ?? {},
  );

  return {
    space: node.space,
    externalId: node.externalId,
    name: name ?? node.externalId,
    mimeType,
    isUploaded,
    uploadStatus: getDocumentUploadStatus(
      { isUploaded, createdTime: node.createdTime },
      currentTime,
    ),
    origin,
    uploadedTime,
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

  const documentView = await findAssetPassportView(client, MODEL.views.document);
  const document: DocumentIdentifier = {
    space: MODEL.instanceSpace,
    externalId: `${DOCUMENT_EXTERNAL_ID_PREFIX}${generateId()}`,
  };

  await client.instances.upsert({
    items: [
      {
        instanceType: INSTANCE_TYPE_NODE,
        space: document.space,
        externalId: document.externalId,
        sources: [
          {
            source: toViewReference(documentView),
            properties: {
              name: file.name,
              mimeType: file.type || DEFAULT_DOCUMENT_MIME_TYPE,
              [MODEL.properties.assetRelation]: {
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
      instanceType: INSTANCE_TYPE_NODE,
      space: document.space,
      externalId: document.externalId,
    },
  ]);
}
