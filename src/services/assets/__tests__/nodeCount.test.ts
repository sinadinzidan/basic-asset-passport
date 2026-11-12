import type { AggregationResponse, CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../../__mocks__/cogniteClient';
import { countNodes, readCount } from '../nodeCount';

const view = { space: 'sp-model', externalId: 'Note', version: 'v1' };
const viewReference = { type: 'view', ...view };

function makeCountResponse(value?: number): AggregationResponse {
  return {
    items: [
      {
        instanceType: 'node',
        aggregates:
          value === undefined ? [] : [{ aggregate: 'count', property: 'externalId', value }],
      },
    ],
  };
}

describe(countNodes.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('counts the nodes of the view on the server, reading none of them', async () => {
    const aggregate = vi
      .spyOn(client.instances, 'aggregate')
      .mockResolvedValue(makeCountResponse(12));

    await expect(countNodes(client, view)).resolves.toBe(12);
    expect(aggregate).toHaveBeenCalledExactlyOnceWith({
      view: viewReference,
      instanceType: 'node',
      aggregates: [{ count: { property: 'externalId' } }],
    });
  });

  it('counts only the nodes the filter matches', async () => {
    const aggregate = vi
      .spyOn(client.instances, 'aggregate')
      .mockResolvedValue(makeCountResponse(3));
    const filter = { equals: { property: ['sp-model', 'Note/v1', 'asset'], value: 'x' } };

    await countNodes(client, view, filter);

    expect(aggregate).toHaveBeenCalledWith(expect.objectContaining({ filter }));
  });

  it('passes on a failure of the aggregate request', async () => {
    vi.spyOn(client.instances, 'aggregate').mockRejectedValue(new Error('no access'));

    await expect(countNodes(client, view)).rejects.toThrow('no access');
  });
});

describe(readCount.name, () => {
  it('reads the count of the answer', () => {
    expect(readCount(makeCountResponse(7))).toBe(7);
  });

  it('counts none when the answer holds no count', () => {
    expect(readCount(makeCountResponse())).toBe(0);
    expect(readCount({ items: [] })).toBe(0);
  });
});
