import type {
  AggregationRequest,
  AggregationResponse,
  ByIdsResponse,
  NodeOrEdge,
  QueryRequest,
  QueryResponse,
  RawPropertyValueV3,
  SlimNodeAndEdgeCollectionResponse,
} from '@cognite/sdk';

import { MODEL } from '../config/model';
import {
  DESCENDING_SORT_DIRECTION,
  INSTANCE_TYPE_NODE,
  NODE_CREATED_TIME_PROPERTY,
  NODE_EXTERNAL_ID_PROPERTY,
  NODE_SPACE_PROPERTY,
  VIEW_SOURCE_TYPE,
} from '../constants/cdfApi';
import { isRecord } from '../lib/isRecord';
import type { NodeInstance } from '../services/assets/viewHelpers';
import type { AssetContextType } from '../types/assetContext';
import type { DocumentFileContextType } from '../types/documentFileContext';

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

type SortRule = {
  property: unknown[];
  isDescending: boolean;
  isNullsFirst: boolean;
};

export function makeMockAssetContext(latencyMs: number = MOCK_LATENCY_MS): AssetContextType {
  const stored: StoredInstances = {
    notes: [...MOCK_NOTES],
    documents: [...MOCK_DOCUMENTS],
  };

  return {
    project: MOCK_PROJECT,
    dataModels: {
      retrieve: () => delay(latencyMs).then(() => ({ items: [MOCK_DATA_MODEL] })),
    },
    instances: {
      query: (request) => delay(latencyMs).then(() => answerQuery(request, stored)),
      search: (request) => delay(latencyMs).then(() => answerAssetSearch(request)),
      aggregate: (request) => delay(latencyMs).then(() => answerCount(request, stored)),
      upsert: (request) => delay(latencyMs).then(() => storeInstances(request, stored)),
      delete: (items) => delay(latencyMs).then(() => removeInstances(items, stored)),
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

function answerCount(request: AggregationRequest, stored: StoredInstances): AggregationResponse {
  if (request.groupBy?.includes(MODEL.properties.asset.status)) {
    return answerCountsByStatus();
  }

  const matching = findNodesCounted(request, stored);

  return {
    items: [
      {
        instanceType: 'node',
        aggregates: [{ aggregate: 'count', value: matching.length }],
      },
    ],
  };
}

function answerCountsByStatus(): AggregationResponse {
  const countsByStatus = new Map<string, number>();

  for (const asset of MOCK_ASSETS) {
    const status = readMockAssetStatus(asset);

    if (status === undefined) continue;

    countsByStatus.set(status, (countsByStatus.get(status) ?? 0) + 1);
  }

  return {
    items: [...countsByStatus].map(([status, value]) => ({
      instanceType: 'node',
      group: { [MODEL.properties.asset.status]: status },
      aggregates: [{ aggregate: 'count', value }],
    })),
  };
}

function readMockAssetStatus(asset: NodeInstance): string | undefined {
  for (const viewProperties of Object.values(asset.properties ?? {})) {
    for (const properties of Object.values(viewProperties)) {
      const status = properties[MODEL.properties.asset.status];

      if (typeof status === 'string') return status;
    }
  }

  return undefined;
}

function findNodesCounted(
  request: AggregationRequest,
  stored: StoredInstances,
): readonly NodeInstance[] {
  const filtered = { nodes: { filter: request.filter } };

  switch (request.view.externalId) {
    case MODEL.views.note:
      return stored.notes.filter((node) =>
        isInstanceForAsset(node, readRequestedAssetReference(filtered)),
      );
    case MODEL.views.document:
      return stored.documents.filter((node) =>
        isInstanceForAsset(node, readRequestedAssetReference(filtered)),
      );
    case MODEL.views.timeseries:
      return MOCK_TIMESERIES.filter((node) =>
        isNodeListingAsset(node, readRequestedAssetsContains(filtered)),
      );
    case MODEL.filesView.externalId:
      return MOCK_FILES.filter((node) =>
        isNodeListingAsset(node, readRequestedAssetsContains(filtered)),
      );
    case MODEL.views.asset:
      return MOCK_ASSETS;
    case MODEL.views.equipment: {
      const { externalId } = readRequestedAssetReference(filtered);

      return externalId === undefined
        ? [...MOCK_EQUIPMENT_BY_ASSET_ID.values()].flat()
        : findEquipmentOfAsset(externalId);
    }
    default:
      return [];
  }
}

function answerQuery(request: QueryRequest, stored: StoredInstances): QueryResponse {
  if ('assets' in request.with) {
    return answerPage(request, 'assets', MOCK_ASSETS);
  }

  if ('asset' in request.with) return answerAssetDetails(request);

  if ('equipment' in request.with) return answerEquipment(request);

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

function answerNodesListingAsset(
  request: QueryRequest,
  resultSetName: string,
  nodes: readonly NodeInstance[],
): QueryResponse {
  const requested = readRequestedAssetsContains(request.with[resultSetName]);
  const matching = nodes.filter((node) => isNodeListingAsset(node, requested));

  return answerPage(request, resultSetName, matching);
}

function isNodeListingAsset(
  node: NodeInstance,
  requested: { space?: string; externalId?: string },
): boolean {
  return Object.values(node.properties ?? {})
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
    });
}

function readRequestedAssetsContains(expression: unknown): {
  space?: string;
  externalId?: string;
} {
  const filter =
    isRecord(expression) && isRecord(expression.nodes) ? expression.nodes.filter : undefined;

  const value = findContainsAnyValue(filter);

  return {
    space: typeof value?.space === 'string' ? value.space : undefined,
    externalId: typeof value?.externalId === 'string' ? value.externalId : undefined,
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

function answerAssetInstances(
  request: QueryRequest,
  resultSetName: string,
  instances: readonly NodeInstance[],
): QueryResponse {
  const requested = readRequestedAssetReference(request.with[resultSetName]);
  const matching = instances.filter((instance) => isInstanceForAsset(instance, requested));

  return answerPage(request, resultSetName, matching);
}

function answerPage(
  request: QueryRequest,
  resultSetName: string,
  nodes: readonly NodeInstance[],
): QueryResponse {
  const expression: unknown = request.with[resultSetName];
  const limit = readLimit(expression) ?? DEFAULT_PAGE_SIZE;
  const sortRules = readSortRules(expression);
  const offset = parseCursor(request.cursors?.[resultSetName]);
  const nextOffset = offset + limit;
  const hasNextCursor = sortRules.length === 0 && nextOffset < nodes.length;

  return {
    items: {
      [resultSetName]: sortNodes(nodes, sortRules)
        .slice(offset, nextOffset)
        .map((node) => selectProperties(node, request, resultSetName)),
    },
    nextCursor: hasNextCursor ? { [resultSetName]: String(nextOffset) } : {},
  };
}

function readSortRules(expression: unknown): SortRule[] {
  if (!isRecord(expression) || !Array.isArray(expression.sort)) return [];

  return expression.sort.flatMap((rule: unknown) => {
    if (!isRecord(rule) || !Array.isArray(rule.property)) return [];

    const isDescending = rule.direction === DESCENDING_SORT_DIRECTION;

    return [
      {
        property: rule.property,
        isDescending,

        isNullsFirst: typeof rule.nullsFirst === 'boolean' ? rule.nullsFirst : isDescending,
      },
    ];
  });
}

function sortNodes(nodes: readonly NodeInstance[], sortRules: SortRule[]): readonly NodeInstance[] {
  if (sortRules.length === 0) return nodes;

  return [...nodes].sort((first, second) => {
    for (const rule of sortRules) {
      const order = compareSortValues(
        readSortValue(first, rule.property),
        readSortValue(second, rule.property),
        rule,
      );

      if (order !== 0) return order;
    }

    return 0;
  });
}

const INVALID_SORT_PROPERTY_MESSAGE =
  'Invalid sort property. Created time sorts as [createdTime]; a node sorts by [node, externalId] or [node, space].';

function readSortValue(node: NodeInstance, property: unknown[]): unknown {
  const [scope, group, name] = property;

  if (property.length === 1) {
    if (scope !== NODE_CREATED_TIME_PROPERTY) throw new Error(INVALID_SORT_PROPERTY_MESSAGE);

    return node.createdTime;
  }

  if (scope === INSTANCE_TYPE_NODE) {
    if (group === NODE_EXTERNAL_ID_PROPERTY) return node.externalId;

    if (group === NODE_SPACE_PROPERTY) return node.space;

    throw new Error(INVALID_SORT_PROPERTY_MESSAGE);
  }

  if (typeof scope !== 'string' || typeof group !== 'string' || typeof name !== 'string') {
    return undefined;
  }

  return node.properties?.[scope]?.[group]?.[name];
}

function compareSortValues(first: unknown, second: unknown, rule: SortRule): number {
  const isFirstEmpty = first === undefined || first === null;
  const isSecondEmpty = second === undefined || second === null;

  if (isFirstEmpty || isSecondEmpty) {
    if (isFirstEmpty && isSecondEmpty) return 0;

    return isFirstEmpty === rule.isNullsFirst ? -1 : 1;
  }

  const order =
    typeof first === 'number' && typeof second === 'number'
      ? first - second
      : compareText(String(first), String(second));

  return rule.isDescending ? -order : order;
}

function compareText(first: string, second: string): number {
  if (first === second) return 0;

  return first < second ? -1 : 1;
}

function storeInstances(
  request: Parameters<AssetContextType['instances']['upsert']>[0],
  stored: StoredInstances,
): SlimNodeAndEdgeCollectionResponse {
  const now = Date.now();
  const items: SlimNodeAndEdgeCollectionResponse['items'] = [];

  for (const item of request.items) {
    if (item.instanceType !== INSTANCE_TYPE_NODE) continue;

    const sources = (item.sources ?? []).flatMap(({ source, properties: values }) =>
      source.type === VIEW_SOURCE_TYPE
        ? [
            {
              space: source.space,
              group: `${source.externalId}/${source.version}`,
              isDocumentView: source.externalId === MODEL.views.document,
              values,
            },
          ]
        : [],
    );

    const isDocument = sources.some(({ isDocumentView }) => isDocumentView);
    const target = isDocument ? stored.documents : stored.notes;

    const existingIndex = target.findIndex(
      (node) => node.space === item.space && node.externalId === item.externalId,
    );

    const existing = target[existingIndex];

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
      target[existingIndex] = { ...existing, properties, lastUpdatedTime: now };
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

function removeInstances(
  items: Parameters<AssetContextType['instances']['delete']>[0],
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

export function makeMockDocumentFileContext(
  assetContext: AssetContextType,
  latencyMs: number = MOCK_LATENCY_MS,
): DocumentFileContextType {
  return {
    requestUploadUrl: (document) =>
      delay(latencyMs).then(() => `${MOCK_UPLOAD_ORIGIN}/${document.space}/${document.externalId}`),
    uploadContent: async (uploadUrl) => {
      await delay(latencyMs);
      const [space, externalId] = uploadUrl.slice(MOCK_UPLOAD_ORIGIN.length + 1).split('/');

      await assetContext.instances.upsert({
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
  node: NodeInstance,
  requested: { space?: string; externalId?: string },
): boolean {
  return Object.values(node.properties ?? {})
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

function answerAssetSearch(
  request: Parameters<AssetContextType['instances']['search']>[0],
): ByIdsResponse {
  const words = (request.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
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
    (node) => node.externalId === requested.externalId && node.space === requested.space,
  );

  return {
    items: {
      asset: asset ? [selectProperties(asset, request, 'asset')] : [],
    },
    nextCursor: {},
  };
}

function answerEquipment(request: QueryRequest): QueryResponse {
  const requested = readRequestedAssetReference(request.with.equipment);

  return answerPage(request, 'equipment', findEquipmentOfAsset(requested.externalId));
}

function findEquipmentOfAsset(assetExternalId: string | undefined): readonly NodeInstance[] {
  return assetExternalId === undefined
    ? []
    : (MOCK_EQUIPMENT_BY_ASSET_ID.get(assetExternalId) ?? []);
}

function selectProperties(
  node: NodeOrEdge,
  request: QueryRequest,
  resultSetName: string,
): NodeOrEdge {
  const selectedNames = readSelectedPropertyNames(request, resultSetName);

  if (selectedNames === undefined || !node.properties) return node;

  const properties: Record<string, Record<string, Record<string, RawPropertyValueV3>>> = {};

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

  return source.properties.filter((name: unknown): name is string => typeof name === 'string');
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
    isRecord(expression) && isRecord(expression.nodes) ? expression.nodes.filter : undefined;

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
    isRecord(expression) && isRecord(expression.nodes) ? expression.nodes.filter : undefined;

  const value = findAssetRelationValue(filter);

  return {
    space: typeof value?.space === 'string' ? value.space : undefined,
    externalId: typeof value?.externalId === 'string' ? value.externalId : undefined,
  };
}

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
    equals.property[equals.property.length - 1] === MODEL.properties.assetRelation &&
    isRecord(equals.value)
  ) {
    return equals.value;
  }

  return undefined;
}

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

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}
