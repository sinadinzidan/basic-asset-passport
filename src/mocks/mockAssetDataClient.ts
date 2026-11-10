import type {
  ByIdsResponse,
  NodeOrEdge,
  QueryRequest,
  QueryResponse,
  RawPropertyValueV3,
  SlimNodeAndEdgeCollectionResponse,
} from '@cognite/sdk';

import { DOCUMENT_VIEW_EXTERNAL_ID } from '../constants/documents';
import type { NodeInstance } from '../services/assets/viewHelpers';
import type { AssetDataClient } from '../types/assetDataClient';
import type { DocumentFileClient } from '../types/documentFileClient';

import {
  MOCK_ASSETS,
  MOCK_DATA_MODEL,
  MOCK_DOCUMENT_VIEW,
  MOCK_DOCUMENTS,
  MOCK_FILES,
  MOCK_EQUIPMENT_BY_ASSET_ID,
  MOCK_NOTES,
  MOCK_TIMESERIES,
  MOCK_VIEW_VERSION,
} from './mockAssetData';

export const MOCK_PROJECT = 'mock-project';
export const MOCK_LATENCY_MS = 300;
export const MOCK_USER_IDENTIFIER = 'mock-user';
export const MOCK_USER_NAME = 'Mock User';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SEARCH_LIMIT = 1000;
const MOCK_UPLOAD_ORIGIN = 'https://mock-upload.test';

type UnknownRecord = Record<string, unknown>;

type StoredInstances = { notes: NodeInstance[]; documents: NodeInstance[] };

/**
 * Answers the exact requests the asset and note services send (data model
 * lookup, the paged `assets` query, the `asset` + `equipment` details query,
 * the `notes` and `documents` queries, note and document creation, deletion
 * and the user profile) with responses shaped like the CDF API's, so the real
 * services run unchanged. Notes and documents added through it are kept in
 * memory for the life of the client.
 */
export function makeMockAssetDataClient(
  latencyMs: number = MOCK_LATENCY_MS,
): AssetDataClient {
  const stored: StoredInstances = {
    notes: [...MOCK_NOTES],
    documents: [...MOCK_DOCUMENTS],
  };

  return {
    project: MOCK_PROJECT,
    dataModels: {
      retrieve: () =>
        delay(latencyMs).then(() => ({ items: [MOCK_DATA_MODEL] })),
    },
    instances: {
      query: (request) =>
        delay(latencyMs).then(() => answerQuery(request, stored)),
      search: (request) =>
        delay(latencyMs).then(() => answerAssetSearch(request)),
      upsert: (request) =>
        delay(latencyMs).then(() => storeInstances(request, stored)),
      delete: (items) =>
        delay(latencyMs).then(() => removeInstances(items, stored)),
    },
    profiles: {
      me: () =>
        delay(latencyMs).then(() => ({
          userIdentifier: MOCK_USER_IDENTIFIER,
          displayName: MOCK_USER_NAME,
          lastUpdatedTime: 0,
        })),
    },
  };
}

function answerQuery(
  request: QueryRequest,
  stored: StoredInstances,
): QueryResponse {
  if ('assets' in request.with) return answerAssetPage(request);
  if ('asset' in request.with) return answerAssetDetails(request);
  if ('notes' in request.with) {
    return answerAssetInstances(request, 'notes', stored.notes);
  }
  if ('documents' in request.with) {
    return answerAssetInstances(request, 'documents', stored.documents);
  }

  if ('timeseries' in request.with) {
    return answerNodesListingAsset(request, 'timeseries', MOCK_TIMESERIES);
  }
  if ('files' in request.with) {
    return answerNodesListingAsset(request, 'files', MOCK_FILES);
  }

  return { items: {}, nextCursor: {} };
}

/** Answers the nodes, such as time series or files, whose `assets` list holds the requested asset. */
function answerNodesListingAsset(
  request: QueryRequest,
  resultSetName: string,
  nodes: readonly NodeInstance[],
): QueryResponse {
  const requested = readRequestedAssetsContains(request.with[resultSetName]);
  const limit = readLimit(request.with[resultSetName]) ?? DEFAULT_PAGE_SIZE;
  const matching = nodes.filter((node) =>
    Object.values(node.properties ?? {})
      .flatMap(Object.values)
      .some((values) => {
        const assets: unknown = values.assets;

        return (
          Array.isArray(assets) &&
          assets.some(
            (asset: unknown) =>
              isRecord(asset) &&
              asset.space === requested.space &&
              asset.externalId === requested.externalId,
          )
        );
      }),
  );

  return {
    items: {
      [resultSetName]: matching
        .slice(0, limit)
        .map((node) => selectProperties(node, request, resultSetName)),
    },
    nextCursor: {},
  };
}

/** Finds `{ containsAny: { property: [..., 'assets'], values: [{ space, externalId }] } }` inside an `and` filter. */
function readRequestedAssetsContains(expression: unknown): {
  space?: string;
  externalId?: string;
} {
  const filter =
    isRecord(expression) && isRecord(expression.nodes)
      ? expression.nodes.filter
      : undefined;
  const value = findContainsAnyValue(filter);

  return {
    space: typeof value?.space === 'string' ? value.space : undefined,
    externalId:
      typeof value?.externalId === 'string' ? value.externalId : undefined,
  };
}

function findContainsAnyValue(filter: unknown): UnknownRecord | undefined {
  if (!isRecord(filter)) return undefined;

  if (Array.isArray(filter.and)) {
    for (const part of filter.and) {
      const found = findContainsAnyValue(part);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const containsAny = filter.containsAny;
  if (isRecord(containsAny) && Array.isArray(containsAny.values)) {
    const [value]: unknown[] = containsAny.values;
    return isRecord(value) ? value : undefined;
  }

  return undefined;
}

/** Answers a query for the nodes linked to one asset, such as its notes or documents. */
function answerAssetInstances(
  request: QueryRequest,
  resultSetName: string,
  instances: readonly NodeInstance[],
): QueryResponse {
  const requested = readRequestedAssetReference(request.with[resultSetName]);
  const limit = readLimit(request.with[resultSetName]) ?? DEFAULT_PAGE_SIZE;
  const matching = instances.filter((instance) =>
    isInstanceForAsset(instance, requested),
  );

  return {
    items: {
      [resultSetName]: matching
        .slice(0, limit)
        .map((node) => selectProperties(node, request, resultSetName)),
    },
    nextCursor: {},
  };
}

/**
 * Stores the note and document nodes of an upsert, as the API would. Writing
 * to an existing node merges the new properties into it, which is how the
 * upload marks a document as uploaded.
 */
function storeInstances(
  request: Parameters<AssetDataClient['instances']['upsert']>[0],
  stored: StoredInstances,
): SlimNodeAndEdgeCollectionResponse {
  const now = Date.now();
  const items: SlimNodeAndEdgeCollectionResponse['items'] = [];

  for (const item of request.items) {
    if (item.instanceType !== 'node') continue;

    const sources = (item.sources ?? []).flatMap(
      ({ source, properties: values }) =>
        source.type === 'view'
          ? [
              {
                space: source.space,
                group: `${source.externalId}/${source.version}`,
                isDocumentView: source.externalId === DOCUMENT_VIEW_EXTERNAL_ID,
                values,
              },
            ]
          : [],
    );
    const isDocument = sources.some(({ isDocumentView }) => isDocumentView);
    const target = isDocument ? stored.documents : stored.notes;
    const existing = target.find(
      (node) =>
        node.space === item.space && node.externalId === item.externalId,
    );
    const properties: NodeInstance['properties'] = {
      ...existing?.properties,
    };
    for (const { space, group, values } of sources) {
      properties[space] = {
        ...properties[space],
        [group]: { ...properties[space]?.[group], ...values },
      };
    }

    if (existing) {
      existing.properties = properties;
      existing.lastUpdatedTime = now;
    } else {
      target.push({
        instanceType: 'node',
        space: item.space,
        externalId: item.externalId,
        version: 1,
        createdTime: now,
        lastUpdatedTime: now,
        properties,
      });
    }
    items.push({
      instanceType: 'node',
      space: item.space,
      externalId: item.externalId,
      version: 1,
      wasModified: true,
      createdTime: existing?.createdTime ?? now,
      lastUpdatedTime: now,
    });
  }

  return { items };
}

/** Removes the deleted nodes, as the API would. */
function removeInstances(
  items: Parameters<AssetDataClient['instances']['delete']>[0],
  stored: StoredInstances,
): UnknownRecord {
  for (const list of [stored.notes, stored.documents]) {
    for (const { space, externalId } of items) {
      const index = list.findIndex(
        (node) => node.space === space && node.externalId === externalId,
      );
      if (index >= 0) list.splice(index, 1);
    }
  }

  return {};
}

/**
 * Answers the file operations of the documents: upload links point at a dummy
 * host, uploading marks the document as uploaded in the data client's store,
 * and downloads are a small text file made in the browser.
 */
export function makeMockDocumentFileClient(
  dataClient: AssetDataClient,
  latencyMs: number = MOCK_LATENCY_MS,
): DocumentFileClient {
  return {
    requestUploadUrl: (document) =>
      delay(latencyMs).then(
        () => `${MOCK_UPLOAD_ORIGIN}/${document.space}/${document.externalId}`,
      ),
    uploadContent: async (uploadUrl) => {
      await delay(latencyMs);
      const [space, externalId] = uploadUrl
        .slice(MOCK_UPLOAD_ORIGIN.length + 1)
        .split('/');

      await dataClient.instances.upsert({
        items: [
          {
            instanceType: 'node',
            space,
            externalId,
            sources: [
              {
                source: {
                  type: 'view',
                  space: MOCK_DOCUMENT_VIEW.space,
                  externalId: MOCK_DOCUMENT_VIEW.externalId,
                  version: MOCK_VIEW_VERSION,
                },
                properties: {
                  isUploaded: true,
                  uploadedTime: new Date().toISOString(),
                },
              },
            ],
          },
        ],
      });
    },
  };
}

function isInstanceForAsset(
  note: NodeInstance,
  requested: { space?: string; externalId?: string },
): boolean {
  return Object.values(note.properties ?? {})
    .flatMap(Object.values)
    .some((values) => {
      const asset: unknown = values.asset;

      return (
        isRecord(asset) &&
        asset.space === requested.space &&
        asset.externalId === requested.externalId
      );
    });
}

function answerAssetPage(request: QueryRequest): QueryResponse {
  const limit = readLimit(request.with.assets) ?? DEFAULT_PAGE_SIZE;
  const offset = parseCursor(request.cursors?.assets);
  const page = MOCK_ASSETS.slice(offset, offset + limit);
  const nextOffset = offset + limit;

  return {
    items: {
      assets: page.map((node) => selectProperties(node, request, 'assets')),
    },
    nextCursor:
      nextOffset < MOCK_ASSETS.length ? { assets: String(nextOffset) } : {},
  };
}

/** Answers a search by keeping the assets whose searched properties hold every word of the text. */
function answerAssetSearch(
  request: Parameters<AssetDataClient['instances']['search']>[0],
): ByIdsResponse {
  const words = (request.query ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const searched = request.properties;
  const limit = request.limit ?? DEFAULT_SEARCH_LIMIT;

  const matching = MOCK_ASSETS.filter((node) => {
    const text = Object.values(node.properties ?? {})
      .flatMap(Object.values)
      .flatMap((values) =>
        Object.entries(values)
          .filter(([name]) => searched === undefined || searched.includes(name))
          .map(([, value]) => value),
      )
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();

    return words.every((word) => text.includes(word));
  });

  return { items: matching.slice(0, limit) };
}

function answerAssetDetails(request: QueryRequest): QueryResponse {
  const requested = readRequestedIdentifier(request.with.asset);
  const asset = MOCK_ASSETS.find(
    (node) =>
      node.externalId === requested.externalId &&
      node.space === requested.space,
  );
  const equipment = asset
    ? (MOCK_EQUIPMENT_BY_ASSET_ID.get(asset.externalId) ?? [])
    : [];

  return {
    items: {
      asset: asset ? [selectProperties(asset, request, 'asset')] : [],
      equipment: equipment.map((node) =>
        selectProperties(node, request, 'equipment'),
      ),
    },
    nextCursor: {},
  };
}

/** Keeps only the properties the request selected, as the API does. */
function selectProperties(
  node: NodeOrEdge,
  request: QueryRequest,
  resultSetName: string,
): NodeOrEdge {
  const selectedNames = readSelectedPropertyNames(request, resultSetName);
  if (selectedNames === undefined || !node.properties) return node;

  const properties: Record<
    string,
    Record<string, Record<string, RawPropertyValueV3>>
  > = {};
  for (const [space, groups] of Object.entries(node.properties)) {
    properties[space] = {};
    for (const [group, values] of Object.entries(groups)) {
      properties[space][group] = Object.fromEntries(
        Object.entries(values).filter(([name]) => selectedNames.includes(name)),
      );
    }
  }

  return { ...node, properties };
}

function readSelectedPropertyNames(
  request: QueryRequest,
  resultSetName: string,
): string[] | undefined {
  const select: unknown = request.select?.[resultSetName];
  if (!isRecord(select) || !Array.isArray(select.sources)) return undefined;

  const [source] = select.sources;
  if (!isRecord(source) || !Array.isArray(source.properties)) return undefined;

  return source.properties.filter(
    (name: unknown): name is string => typeof name === 'string',
  );
}

function readLimit(expression: unknown): number | undefined {
  return isRecord(expression) && typeof expression.limit === 'number'
    ? expression.limit
    : undefined;
}

function readRequestedIdentifier(expression: unknown): {
  space?: string;
  externalId?: string;
} {
  const filter =
    isRecord(expression) && isRecord(expression.nodes)
      ? expression.nodes.filter
      : undefined;

  return {
    space: findEqualsValue(filter, 'space'),
    externalId: findEqualsValue(filter, 'externalId'),
  };
}

function readRequestedAssetReference(expression: unknown): {
  space?: string;
  externalId?: string;
} {
  const filter =
    isRecord(expression) && isRecord(expression.nodes)
      ? expression.nodes.filter
      : undefined;
  const value = findAssetRelationValue(filter);

  return {
    space: typeof value?.space === 'string' ? value.space : undefined,
    externalId:
      typeof value?.externalId === 'string' ? value.externalId : undefined,
  };
}

/** Finds `{ equals: { property: [..., 'asset'], value: { space, externalId } } }` inside an `and` filter. */
function findAssetRelationValue(filter: unknown): UnknownRecord | undefined {
  if (!isRecord(filter)) return undefined;

  if (Array.isArray(filter.and)) {
    for (const part of filter.and) {
      const found = findAssetRelationValue(part);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const equals = filter.equals;
  if (
    isRecord(equals) &&
    Array.isArray(equals.property) &&
    equals.property[equals.property.length - 1] === 'asset' &&
    isRecord(equals.value)
  ) {
    return equals.value;
  }

  return undefined;
}

/** Finds `{ equals: { property: ['node', name], value } }` inside an `and` filter. */
function findEqualsValue(filter: unknown, name: string): string | undefined {
  if (!isRecord(filter)) return undefined;

  if (Array.isArray(filter.and)) {
    for (const part of filter.and) {
      const found = findEqualsValue(part, name);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  const equals = filter.equals;
  if (
    isRecord(equals) &&
    Array.isArray(equals.property) &&
    equals.property[1] === name &&
    typeof equals.value === 'string'
  ) {
    return equals.value;
  }

  return undefined;
}

function parseCursor(cursor: string | undefined): number {
  const offset = Number(cursor);
  return Number.isInteger(offset) && offset > 0 ? offset : 0;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
