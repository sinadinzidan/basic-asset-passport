import type { ViewDefinition } from '@cognite/sdk';

import {
  ASSET_EQUIPMENT_QUERY_LIMIT,
  ASSET_VIEW_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  EQUIPMENT_VIEW_EXTERNAL_ID,
  INTERNAL_DETAIL_PROPERTY_IDENTIFIERS,
} from '../../constants/assets';
import type {
  AssetEquipmentDetails,
  AssetIdentifier,
  AssetInstanceDetails,
} from '../../types/asset';
import type { AssetDataClient } from '../../types/assetDataClient';

import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
  type NodeInstance,
} from './viewHelpers';

type MappedProperty = { identifier: string; label: string };

export async function getAssetEquipmentDetails(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
): Promise<AssetEquipmentDetails> {
  const views = await listAssetPassportViews(client);
  const assetView = views.find(
    (view) => view.externalId === ASSET_VIEW_EXTERNAL_ID,
  );
  const equipmentView = views.find(
    (view) => view.externalId === EQUIPMENT_VIEW_EXTERNAL_ID,
  );

  if (!assetView || !equipmentView) {
    throw new Error(
      `The ${ASSET_VIEW_EXTERNAL_ID} and ${EQUIPMENT_VIEW_EXTERNAL_ID} views must exist in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

  const assetViewReference = toViewReference(assetView);
  const equipmentViewReference = toViewReference(equipmentView);
  const assetProperties = getMappedProperties(assetView);
  const equipmentProperties = getMappedProperties(equipmentView);
  const response = await client.instances.query({
    with: {
      asset: {
        nodes: {
          filter: {
            and: [
              {
                equals: {
                  property: ['node', 'space'],
                  value: assetIdentifier.space,
                },
              },
              {
                equals: {
                  property: ['node', 'externalId'],
                  value: assetIdentifier.externalId,
                },
              },
              { hasData: [assetViewReference] },
            ],
          },
        },
        limit: 1,
      },
      equipment: {
        nodes: {
          from: 'asset',
          through: { source: equipmentViewReference, identifier: 'asset' },
          direction: 'inwards',
          filter: { hasData: [equipmentViewReference] },
        },
        limit: ASSET_EQUIPMENT_QUERY_LIMIT,
      },
    },
    select: {
      asset: {
        sources: [
          {
            source: assetViewReference,
            properties: assetProperties.map(({ identifier }) => identifier),
          },
        ],
      },
      equipment: {
        sources: [
          {
            source: equipmentViewReference,
            properties: equipmentProperties.map(({ identifier }) => identifier),
          },
        ],
      },
    },
  });

  const assetNode = (response.items.asset ?? []).find(isNodeInstance);

  if (!assetNode) {
    throw new Error(
      `Asset ${assetIdentifier.externalId} was not found in ${assetIdentifier.space}.`,
    );
  }

  return {
    asset: toInstanceDetails(assetNode, assetView, assetProperties),
    equipment: (response.items.equipment ?? [])
      .filter(isNodeInstance)
      .map((node) =>
        toInstanceDetails(node, equipmentView, equipmentProperties),
      ),
  };
}

function getMappedProperties(view: ViewDefinition): MappedProperty[] {
  return Object.entries(view.properties).flatMap(([identifier, property]) => {
    if (!('containerPropertyIdentifier' in property)) return [];
    if (INTERNAL_DETAIL_PROPERTY_IDENTIFIERS.has(identifier)) return [];
    if (property.type.type === 'direct' || property.type.type === 'json') {
      return [];
    }

    return [{ identifier, label: property.name?.trim() || identifier }];
  });
}

function toInstanceDetails(
  node: NodeInstance,
  view: ViewDefinition,
  mappedProperties: MappedProperty[],
): AssetInstanceDetails {
  const viewProperties = getNodeViewProperties(node, view);

  return {
    space: node.space,
    externalId: node.externalId,
    properties: mappedProperties.flatMap(({ identifier, label }) => {
      const value = formatPropertyValue(viewProperties?.[identifier]);
      return value === undefined ? [] : [{ identifier, label, value }];
    }),
  };
}

function formatPropertyValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : undefined;
  }
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return (
      value
        .flatMap((item: unknown) => {
          const formatted = formatPropertyValue(item);
          return formatted === undefined ? [] : [formatted];
        })
        .join(', ') || undefined
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length > 0 ? JSON.stringify(value) : undefined;
  }
  return undefined;
}
