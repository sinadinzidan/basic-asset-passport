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
    const documentView = await findAssetPassportView(this.client, MODEL.views.document);

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

    const documentView = await findAssetPassportView(this.client, MODEL.views.document);
    const document: DocumentIdentifier = {
      space: MODEL.instanceSpace,
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
