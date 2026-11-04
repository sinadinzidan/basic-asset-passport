import type {
  NodeOrEdge,
  QueryRequest,
  QueryResponse,
  RawPropertyValueV3,
} from '@cognite/sdk';

import type { AssetDataClient } from '../types/assetDataClient';

import {
  MOCK_ASSETS,
  MOCK_EQUIPMENT_BY_ASSET_ID,
  MOCK_VIEWS,
} from './mockAssetData';

export const MOCK_PROJECT = 'mock-project';
export const MOCK_LATENCY_MS = 300;

const DEFAULT_PAGE_SIZE = 10;

type UnknownRecord = Record<string, unknown>;

/**
 * Answers the exact requests the asset services send (view lookup, the paged
 * `assets` query and the `asset` + `equipment` details query) with responses
 * shaped like the CDF API's, so the real services run unchanged.
 */
export function makeMockAssetDataClient(
  latencyMs: number = MOCK_LATENCY_MS,
): AssetDataClient {
  return {
    project: MOCK_PROJECT,
    views: {
      list: () => ({
        autoPagingToArray: () => delay(latencyMs).then(() => MOCK_VIEWS),
      }),
    },
    instances: {
      query: (request) => delay(latencyMs).then(() => answerQuery(request)),
    },
  };
}

function answerQuery(request: QueryRequest): QueryResponse {
  if ('assets' in request.with) return answerAssetPage(request);
  if ('asset' in request.with) return answerAssetDetails(request);

  return { items: {}, nextCursor: {} };
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
