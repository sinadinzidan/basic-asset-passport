import type { AggregationResponse, FilterDefinition } from '@cognite/sdk';

import { COUNT_AGGREGATE, COUNT_PROPERTY, INSTANCE_TYPE_NODE } from '../../constants/cdfApi';
import type { AssetContextType } from '../../types/assetContext';

import { toViewReference, type ViewIdentity } from './viewHelpers';

export async function countNodes(
  client: AssetContextType,
  view: ViewIdentity,
  filter?: FilterDefinition,
): Promise<number> {
  const response = await client.instances.aggregate({
    view: toViewReference(view),
    instanceType: INSTANCE_TYPE_NODE,
    aggregates: [{ count: { property: COUNT_PROPERTY } }],
    ...(filter ? { filter } : {}),
  });

  return readCount(response);
}

export function readCount(response: AggregationResponse): number {
  const [result] = response.items;
  const countValue = result?.aggregates.find(
    (aggregate) => aggregate.aggregate === COUNT_AGGREGATE,
  );

  return countValue && 'value' in countValue && countValue.value !== undefined
    ? countValue.value
    : 0;
}
