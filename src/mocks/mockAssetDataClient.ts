import type {
  NodeOrEdge,
  QueryRequest,
  QueryResponse,
  RawPropertyValueV3,
  SlimNodeAndEdgeCollectionResponse,
} from '@cognite/sdk';

import type { NodeInstance } from '../services/assets/viewHelpers';
import type { AssetDataClient } from '../types/assetDataClient';

import {
  MOCK_ASSETS,
  MOCK_DATA_MODEL,
  MOCK_EQUIPMENT_BY_ASSET_ID,
  MOCK_NOTES,
} from './mockAssetData';

export const MOCK_PROJECT = 'mock-project';
export const MOCK_LATENCY_MS = 300;
export const MOCK_USER_IDENTIFIER = 'mock-user';
export const MOCK_USER_NAME = 'Mock User';

const DEFAULT_PAGE_SIZE = 10;

type UnknownRecord = Record<string, unknown>;

/**
 * Answers the exact requests the asset and note services send (data model
 * lookup, the paged `assets` query, the `asset` + `equipment` details query,
 * the `notes` query, note creation and the user profile) with responses
 * shaped like the CDF API's, so the real services run unchanged. Notes added
 * through it are kept in memory for the life of the client.
 */
export function makeMockAssetDataClient(
  latencyMs: number = MOCK_LATENCY_MS,
): AssetDataClient {
  const notes: NodeInstance[] = [...MOCK_NOTES];

  return {
    project: MOCK_PROJECT,
    dataModels: {
      retrieve: () =>
        delay(latencyMs).then(() => ({ items: [MOCK_DATA_MODEL] })),
    },
    instances: {
      query: (request) =>
        delay(latencyMs).then(() => answerQuery(request, notes)),
      upsert: (request) =>
        delay(latencyMs).then(() => storeNotes(request, notes)),
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
  notes: readonly NodeInstance[],
): QueryResponse {
  if ('assets' in request.with) return answerAssetPage(request);
  if ('asset' in request.with) return answerAssetDetails(request);
  if ('notes' in request.with) return answerNotes(request, notes);

  return { items: {}, nextCursor: {} };
}

function answerNotes(
  request: QueryRequest,
  notes: readonly NodeInstance[],
): QueryResponse {
  const requested = readRequestedAssetReference(request.with.notes);
  const limit = readLimit(request.with.notes) ?? DEFAULT_PAGE_SIZE;
  const matching = notes.filter((note) =>
    isNoteForAsset(note, requested),
  );

  return {
    items: {
      notes: matching
        .slice(0, limit)
        .map((node) => selectProperties(node, request, 'notes')),
    },
    nextCursor: {},
  };
}

/** Stores the note nodes of an upsert, as the API would create them. */
function storeNotes(
  request: Parameters<AssetDataClient['instances']['upsert']>[0],
  notes: NodeInstance[],
): SlimNodeAndEdgeCollectionResponse {
  const now = Date.now();
  const items: SlimNodeAndEdgeCollectionResponse['items'] = [];

  for (const item of request.items) {
    if (item.instanceType !== 'node') continue;

    const properties: NodeInstance['properties'] = {};
    for (const { source, properties: values } of item.sources ?? []) {
      if (source.type !== 'view') continue;
      properties[source.space] = {
        ...properties[source.space],
        [`${source.externalId}/${source.version}`]: { ...values },
      };
    }
    notes.push({
      instanceType: 'node',
      space: item.space,
      externalId: item.externalId,
      version: 1,
      createdTime: now,
      lastUpdatedTime: now,
      properties,
    });
    items.push({
      instanceType: 'node',
      space: item.space,
      externalId: item.externalId,
      version: 1,
      wasModified: true,
      createdTime: now,
      lastUpdatedTime: now,
    });
  }

  return { items };
}

function isNoteForAsset(
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
