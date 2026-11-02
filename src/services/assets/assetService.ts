import type { CogniteClient, ViewReference } from '@cognite/sdk';
import { z } from 'zod';

import { ASSET_SEARCH_LIMIT, ASSET_VIEW, EQUIPMENT_VIEW, FILE_VIEW } from '../../constants/assets';
import { cdfTaskRunner } from '../../lib/cdfTaskRunner';
import type { AssetRecord, EquipmentDetail, EquipmentRecord, FileRecord, InstanceReference } from '../../types/asset';

export interface AssetPage {
  items: AssetRecord[];
  nextCursor?: Record<string, string>;
  hasMore?: boolean;
  isSearchLimited?: boolean;
}

type QueryInstance = Awaited<ReturnType<CogniteClient['instances']['query']>>['items'][string][number];
type PropertyCarrier = Pick<QueryInstance, 'space' | 'externalId' | 'properties'>;

export interface RelatedFiles {
  assetFiles: FileRecord[];
  equipmentFiles: FileRecord[];
}

function readProperty(instance: PropertyCarrier, view: ViewReference, property: string): unknown {
  return instance.properties?.[view.space]?.[`${view.externalId}/${view.version}`]?.[property];
}

// CDF returns data model properties as untyped JSON, so each one is parsed with a schema before the app uses it.
const instanceReferenceSchema = z.object({ space: z.string(), externalId: z.string() });
const referenceListSchema = z.array(instanceReferenceSchema).nullish().transform((references) => references ?? undefined);
// Blank text counts as missing, so a name of spaces falls back to the external id instead of rendering nothing.
const optionalTextSchema = z.string().nullish().transform((text) => text?.trim() || undefined);

function parseProperty<Schema extends z.ZodType>(schema: Schema, instance: PropertyCarrier, view: ViewReference, property: string): z.output<Schema> {
  const result = schema.safeParse(readProperty(instance, view, property));
  if (!result.success) throw new Error(`Invalid ${property} property on ${instance.space}/${instance.externalId}.`);
  return result.data;
}

function readReferenceList(instance: PropertyCarrier, view: ViewReference, property: string): InstanceReference[] | undefined {
  return parseProperty(referenceListSchema, instance, view, property);
}

function readStringProperty(instance: PropertyCarrier, view: ViewReference, property: string): string | undefined {
  return parseProperty(optionalTextSchema, instance, view, property);
}

function toAssetRecord(asset: QueryInstance): AssetRecord {
  if (asset.instanceType !== 'node') throw new Error('CDF asset query returned an unexpected edge.');
  return {
    id: JSON.stringify([asset.space, asset.externalId]),
    space: asset.space,
    externalId: asset.externalId,
    name: readStringProperty(asset, ASSET_VIEW, 'name') || asset.externalId,
    description: readStringProperty(asset, ASSET_VIEW, 'description'),
  };
}

export async function searchAssets(client: Pick<CogniteClient, 'instances'>, query: string, limit: number = ASSET_SEARCH_LIMIT): Promise<AssetRecord[]> {
  const response = await cdfTaskRunner.schedule(() => client.instances.search({
    view: ASSET_VIEW, query, properties: ['name', 'description'], operator: 'AND', limit,
  }));
  return response.items.map(toAssetRecord);
}

export async function fetchAssets(
  client: Pick<CogniteClient, 'instances'>,
  pageSize: number,
  cursors?: Record<string, string>
): Promise<AssetPage> {
  const response = await cdfTaskRunner.schedule(() => client.instances.query({
    with: {
      assets: {
        limit: pageSize,
        nodes: { filter: { hasData: [ASSET_VIEW] } },
      },
    },
    select: {
      assets: { sources: [{ source: ASSET_VIEW, properties: ['name', 'description'] }] },
    },
    ...(cursors ? { cursors } : {}),
  }));
  const assets = response.items.assets;
  if (!assets) throw new Error('CDF query did not return the assets result set.');

  return {
    items: assets.map(toAssetRecord),
    nextCursor: response.nextCursor,
  };
}

// Equipment is requested with every property of the view, so details are shown whatever the model names them.
const EQUIPMENT_IDENTITY_PROPERTIES = new Set(['name', 'description', 'files', 'asset']);
const EQUIPMENT_DETAIL_ORDER = ['manufacturer', 'serialNumber', 'tagNumber', 'className', 'system', 'partNumber', 'area', 'facility'];
const EQUIPMENT_DETAIL_LABELS: Record<string, string> = { className: 'Class' };

function toDetailLabel(property: string): string {
  const label = EQUIPMENT_DETAIL_LABELS[property]
    ?? property.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// A timestamp at exactly midnight UTC is a date, shown as one so dates read the same as the file dates.
const MIDNIGHT_UTC_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})T00:00(?::00(?:\.0+)?)?(?:Z|[+-]00:?00)$/;

function toDetailValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim().replace(MIDNIGHT_UTC_TIMESTAMP, '$1') || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    // Items that cannot be shown are skipped rather than hiding the whole list.
    const parts = value.map(toDetailValue).filter((part): part is string => part !== undefined);
    return parts.length > 0 ? parts.join(', ') : undefined;
  }
  return undefined;
}

function toEquipmentDetails(properties: Record<string, unknown>): EquipmentDetail[] {
  const rank = (property: string): number => {
    const index = EQUIPMENT_DETAIL_ORDER.indexOf(property);
    return index === -1 ? EQUIPMENT_DETAIL_ORDER.length : index;
  };
  const details = Object.entries(properties)
    .filter(([property]) => !EQUIPMENT_IDENTITY_PROPERTIES.has(property))
    .sort(([left], [right]) => rank(left) - rank(right))
    .flatMap(([property, value]) => {
      const text = toDetailValue(value);
      return text ? [{ property, label: toDetailLabel(property), value: text }] : [];
    });
  // Properties such as serial_number and serialNumber read the same; the first keeps the plain label and later ones add their raw name.
  const seen = new Set<string>();
  return details.map(({ property, label, value }) => {
    const unique = seen.has(label) ? `${label} (${property})` : label;
    seen.add(label);
    return { label: unique, value };
  });
}

export async function fetchAssetEquipment(
  client: Pick<CogniteClient, 'instances'>,
  asset: { space: string; externalId: string },
  pageSize: number
): Promise<EquipmentRecord[]> {
  const response = await cdfTaskRunner.schedule(() => client.instances.query({
    with: {
      equipment: {
        limit: pageSize,
        nodes: {
          filter: {
            and: [
              { hasData: [EQUIPMENT_VIEW] },
              {
                equals: {
                  property: [EQUIPMENT_VIEW.space, `${EQUIPMENT_VIEW.externalId}/${EQUIPMENT_VIEW.version}`, 'asset'],
                  value: { space: asset.space, externalId: asset.externalId },
                },
              },
            ],
          },
        },
      },
    },
    select: {
      equipment: { sources: [{ source: EQUIPMENT_VIEW, properties: ['*'] }] },
    },
  }));
  const equipment = response.items.equipment;
  if (!equipment) throw new Error('CDF query did not return the equipment result set.');

  return equipment.map((item) => {
    if (item.instanceType !== 'node') throw new Error('CDF equipment query returned an unexpected edge.');
    const properties = item.properties?.[EQUIPMENT_VIEW.space]?.[`${EQUIPMENT_VIEW.externalId}/${EQUIPMENT_VIEW.version}`] ?? {};
    const record: EquipmentRecord = {
      id: JSON.stringify([item.space, item.externalId]),
      space: item.space,
      externalId: item.externalId,
      name: readStringProperty(item, EQUIPMENT_VIEW, 'name') || item.externalId,
      details: toEquipmentDetails(properties),
    };
    const description = readStringProperty(item, EQUIPMENT_VIEW, 'description');
    if (description) record.description = description;
    for (const property of ['area', 'facility'] as const) {
      const value = toDetailValue(properties[property]);
      if (value) record[property] = value;
    }
    const fileRefs = readReferenceList(item, EQUIPMENT_VIEW, 'files');
    if (fileRefs?.length) record.fileRefs = fileRefs;
    return record;
  });
}

const FILE_PROPERTIES = ['name', 'description', 'mimeType', 'revision', 'issueDate', 'uploadedTime'];
const MAX_RETRIEVE_ITEMS = 1000;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

function toFileRecord(file: PropertyCarrier): FileRecord {
  const record: FileRecord = {
    id: JSON.stringify([file.space, file.externalId]),
    space: file.space,
    externalId: file.externalId,
    name: readStringProperty(file, FILE_VIEW, 'name') || file.externalId,
  };
  const description = readStringProperty(file, FILE_VIEW, 'description');
  const mimeType = readStringProperty(file, FILE_VIEW, 'mimeType');
  const revision = readStringProperty(file, FILE_VIEW, 'revision');
  const date = readStringProperty(file, FILE_VIEW, 'issueDate') ?? readStringProperty(file, FILE_VIEW, 'uploadedTime');
  if (description) record.description = description;
  if (mimeType) record.mimeType = mimeType;
  if (revision) record.revision = revision;
  if (date) record.date = date.slice(0, ISO_DATE_LENGTH);
  return record;
}

export async function fetchRelatedFiles(
  client: Pick<CogniteClient, 'instances'>,
  asset: InstanceReference,
  equipmentFileRefs: InstanceReference[],
  limit: number
): Promise<RelatedFiles> {
  const uniqueRefs = [...new Map(equipmentFileRefs.map((ref) => [JSON.stringify([ref.space, ref.externalId]), ref])).values()]
    .slice(0, MAX_RETRIEVE_ITEMS);

  const [assetResponse, equipmentResponse] = await Promise.all([
    cdfTaskRunner.schedule(() => client.instances.query({
      with: {
        files: {
          limit,
          nodes: {
            filter: {
              containsAny: {
                property: [FILE_VIEW.space, `${FILE_VIEW.externalId}/${FILE_VIEW.version}`, 'assets'],
                values: [{ space: asset.space, externalId: asset.externalId }],
              },
            },
          },
        },
      },
      select: { files: { sources: [{ source: FILE_VIEW, properties: FILE_PROPERTIES }] } },
    })),
    uniqueRefs.length === 0
      ? Promise.resolve({ items: [] })
      : cdfTaskRunner.schedule(() => client.instances.retrieve({
        items: uniqueRefs.map((ref) => ({ instanceType: 'node' as const, ...ref })),
        sources: [{ source: FILE_VIEW }],
      })),
  ]);

  const assetFiles = assetResponse.items.files;
  if (!assetFiles) throw new Error('CDF query did not return the files result set.');

  return {
    assetFiles: assetFiles.map(toFileRecord),
    equipmentFiles: equipmentResponse.items.map(toFileRecord),
  };
}
