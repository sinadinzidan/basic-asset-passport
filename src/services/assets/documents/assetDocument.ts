import type { FilterDefinition } from '@cognite/sdk';

import {
  ASSET_RELATION_PROPERTY_IDENTIFIER,
  DESCENDING_SORT_DIRECTION,
  INSTANCE_TYPE_NODE,
} from '../../../constants/cdfApi';
import {
  DEFAULT_DOCUMENT_MIME_TYPE,
  DOCUMENT_EXTERNAL_ID_PREFIX,
  DOCUMENT_INSTANCE_SPACE,
  DOCUMENT_QUERY_LIMIT,
  DOCUMENT_VIEW_EXTERNAL_ID,
  FILES_ASSETS_PROPERTY,
  FILES_VIEW,
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
import { matchAssetInList, matchAssetRelation } from '../assetFilter';
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

const UPLOADED_TIME_PROPERTY = 'uploadedTime';
const DOCUMENT_PROPERTIES = ['name', 'mimeType', 'isUploaded', UPLOADED_TIME_PROPERTY];
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

export interface AssetDocumentService {
  listAssetDocuments(
    assetIdentifier: AssetIdentifier,
    limit?: number,
  ): Promise<LimitedList<AssetDocument>>;
  listAssetLinkedFiles(
    assetIdentifier: AssetIdentifier,
    limit?: number,
  ): Promise<LimitedList<AssetDocument>>;
  uploadAssetDocument(
    files: DocumentFileContextType,
    assetIdentifier: AssetIdentifier,
    file: File,
  ): Promise<void>;
  deleteAssetDocument(document: DocumentIdentifier): Promise<void>;
}

class CdfAssetDocumentService implements AssetDocumentService {
  constructor(
    private readonly client: AssetContextType,
    private readonly deps: UploadDocumentDeps,
  ) {}

  listAssetDocuments = async (
    assetIdentifier: AssetIdentifier,
    limit: number = DOCUMENT_QUERY_LIMIT,
  ): Promise<LimitedList<AssetDocument>> => {
    const currentTime = this.deps.now();
    const documentView = await findAssetPassportView(this.client, DOCUMENT_VIEW_EXTERNAL_ID);

    return listDocumentNodes(
      this.client,
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
  };

  listAssetLinkedFiles = (
    assetIdentifier: AssetIdentifier,
    limit: number = DOCUMENT_QUERY_LIMIT,
  ): Promise<LimitedList<AssetDocument>> => {
    return listDocumentNodes(
      this.client,
      {
        resultSetName: FILES_RESULT_SET,
        view: FILES_VIEW,
        assetFilter: matchAssetInList(FILES_VIEW, FILES_ASSETS_PROPERTY, assetIdentifier),
        origin: DocumentOrigin.RMDM,
        nullsFirst: false,
      },
      limit,
      this.deps.now(),
    );
  };

  uploadAssetDocument = async (
    files: DocumentFileContextType,
    assetIdentifier: AssetIdentifier,
    file: File,
  ): Promise<void> => {
    const problem = getDocumentFileProblem(file);
    if (problem) throw new Error(problem);

    const documentView = await findAssetPassportView(this.client, DOCUMENT_VIEW_EXTERNAL_ID);
    const document: DocumentIdentifier = {
      space: DOCUMENT_INSTANCE_SPACE,
      externalId: `${DOCUMENT_EXTERNAL_ID_PREFIX}${this.deps.generateId()}`,
    };

    await this.client.instances.upsert({
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
                [ASSET_RELATION_PROPERTY_IDENTIFIER]: {
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
      await this.deleteAssetDocument(document).catch(() => undefined);
      throw error;
    }
  };

  deleteAssetDocument = async (document: DocumentIdentifier): Promise<void> => {
    await this.client.instances.delete([
      {
        instanceType: INSTANCE_TYPE_NODE,
        space: document.space,
        externalId: document.externalId,
      },
    ]);
  };
}

export function createAssetDocumentService(
  client: AssetContextType,
  overrides?: Partial<UploadDocumentDeps>,
): AssetDocumentService {
  return new CdfAssetDocumentService(client, { ...defaultDeps, ...overrides });
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
    uploadedTime: getTimestampProperty(properties, UPLOADED_TIME_PROPERTY),
    createdTime: node.createdTime,
  };
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
