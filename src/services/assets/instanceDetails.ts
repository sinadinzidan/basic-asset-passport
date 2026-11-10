import type { ViewDefinition } from '@cognite/sdk';

import { INTERNAL_DETAIL_PROPERTY_IDENTIFIERS } from '../../constants/assets';
import type { AssetInstanceDetails } from '../../types/asset';

import { getNodeViewProperties, type NodeInstance } from './viewHelpers';

export type MappedProperty = { identifier: string; label: string };

/** The properties of a view worth showing: plain values, not relations, JSON or system fields. */
export function getMappedProperties(view: ViewDefinition): MappedProperty[] {
  return Object.entries(view.properties).flatMap(([identifier, property]) => {
    if (!('containerPropertyIdentifier' in property)) return [];
    if (INTERNAL_DETAIL_PROPERTY_IDENTIFIERS.has(identifier)) return [];
    if (property.type.type === 'direct' || property.type.type === 'json') {
      return [];
    }

    return [{ identifier, label: property.name?.trim() || identifier }];
  });
}

/** One node as a list of labelled, readable values. */
export function toInstanceDetails(
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
