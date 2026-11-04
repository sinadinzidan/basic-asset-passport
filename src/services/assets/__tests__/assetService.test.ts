import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ASSET_QUERY_LIMIT } from '../../../constants/assets';
import {
  makeNodeInstance,
  makeQueryResponse,
  makeViewDefinition,
} from '../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubViewList,
} from '../../../mocks/cogniteClient';
import { listAssets } from '../assetService';

const assetView = makeViewDefinition('Asset', { name: {} });
const assetReference = {
  type: 'view',
  space: assetView.space,
  externalId: 'Asset',
  version: assetView.version,
};

describe(listAssets.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries one page of Asset nodes and selects the list properties', async () => {
    // Arrange
    stubViewList(client, [assetView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ assets: [] }));

    // Act
    await listAssets(client);

    // Assert
    expect(query).toHaveBeenCalledWith({
      with: {
        assets: {
          nodes: { filter: { hasData: [assetReference] } },
          limit: ASSET_QUERY_LIMIT,
        },
      },
      select: {
        assets: {
          sources: [
            {
              source: assetReference,
              properties: [
                'name',
                'description',
                'plantName',
                'flocStatus',
                'abcIndicatorName',
              ],
            },
          ],
        },
      },
    });
  });

  it('continues from the given cursor', async () => {
    stubViewList(client, [assetView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ assets: [] }));

    await listAssets(client, 'page-2');

    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ cursors: { assets: 'page-2' } }),
    );
  });

  it('maps nodes to list items and exposes the next cursor', async () => {
    // Arrange
    stubViewList(client, [assetView]);
    const node = makeNodeInstance(
      assetView,
      { space: 'instances', externalId: 'FLOC-1' },
      {
        name: 'Cooling Water Pump',
        description: '   ',
        plantName: 'North Plant',
        flocStatus: 'Operating',
        abcIndicatorName: 42,
      },
    );
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ assets: [node] }, { assets: 'next' }),
    );

    // Act
    const page = await listAssets(client);

    // Assert
    expect(page).toEqual({
      items: [
        {
          space: 'instances',
          externalId: 'FLOC-1',
          name: 'Cooling Water Pump',
          description: null,
          plantName: 'North Plant',
          flocStatus: 'Operating',
          abcIndicatorName: null,
        },
      ],
      nextCursor: 'next',
    });
  });

  it('returns an empty last page when nothing matches', async () => {
    stubViewList(client, [assetView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({}),
    );

    await expect(listAssets(client)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('throws when the Asset view does not exist', async () => {
    stubViewList(client, [makeViewDefinition('Equipment')]);

    await expect(listAssets(client)).rejects.toThrow(
      'The Asset view was not found in sp-dm-idi-asset.',
    );
  });

  it('propagates query failures', async () => {
    stubViewList(client, [assetView]);
    vi.spyOn(client.instances, 'query').mockRejectedValue(
      new Error('query failed'),
    );

    await expect(listAssets(client)).rejects.toThrow('query failed');
  });
});
