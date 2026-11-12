import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNodeInstance, makeQueryResponse, makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { ASSET_QUERY_LIMIT, ASSET_SEARCH_LIMIT } from '../../../constants/assets';
import { createAssetService } from '../asset';

const assetView = makeViewDefinition('Asset', { name: {} });
const assetReference = {
  type: 'view',
  space: assetView.space,
  externalId: 'Asset',
  version: assetView.version,
};

describe('listAssets', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries one page of Asset nodes and selects the list properties', async () => {
    // Arrange
    stubModelViews(client, [assetView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ assets: [] }));

    // Act
    await createAssetService(client).listAssets();

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
              properties: ['name', 'description', 'plantName', 'flocStatus', 'abcIndicatorName'],
            },
          ],
        },
      },
    });
  });

  it('continues from the given cursor', async () => {
    stubModelViews(client, [assetView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ assets: [] }));

    await createAssetService(client).listAssets('page-2');

    expect(query).toHaveBeenCalledWith(expect.objectContaining({ cursors: { assets: 'page-2' } }));
  });

  it('maps nodes to list items and exposes the next cursor', async () => {
    // Arrange
    stubModelViews(client, [assetView]);
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
    const page = await createAssetService(client).listAssets();

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
      hasMore: true,
    });
  });

  it('returns an empty last page when nothing matches', async () => {
    stubModelViews(client, [assetView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({}));

    await expect(createAssetService(client).listAssets()).resolves.toEqual({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('throws when the Asset view does not exist', async () => {
    stubModelViews(client, [makeViewDefinition('Equipment')]);

    await expect(createAssetService(client).listAssets()).rejects.toThrow(
      'The Asset view was not found in the Asset_Passport data model.',
    );
  });

  it('propagates query failures', async () => {
    stubModelViews(client, [assetView]);
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('query failed'));

    await expect(createAssetService(client).listAssets()).rejects.toThrow('query failed');
  });
});

describe('searchAssets', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('searches the Asset view for the text in name, description and plant', async () => {
    // Arrange
    stubModelViews(client, [assetView]);
    const search = vi.spyOn(client.instances, 'search').mockResolvedValue({ items: [] });

    // Act
    await createAssetService(client).searchAssets('pump');

    // Assert
    expect(search).toHaveBeenCalledWith({
      view: assetReference,
      query: 'pump',
      instanceType: 'node',
      properties: ['name', 'description', 'plantName'],
      limit: ASSET_SEARCH_LIMIT + 1,
    });
  });

  it('maps the matches to list items and has no further page', async () => {
    // Arrange
    stubModelViews(client, [assetView]);
    const node = makeNodeInstance(
      assetView,
      { space: 'instances', externalId: 'FLOC-2' },
      {
        name: 'Feed Pump',
        description: 'Feeds the boiler',
        plantName: 'South Plant',
        flocStatus: 'Operating',
        abcIndicatorName: 'B',
      },
    );
    vi.spyOn(client.instances, 'search').mockResolvedValue({ items: [node] });

    // Act
    const page = await createAssetService(client).searchAssets('pump');

    // Assert
    expect(page).toEqual({
      items: [
        {
          space: 'instances',
          externalId: 'FLOC-2',
          name: 'Feed Pump',
          description: 'Feeds the boiler',
          plantName: 'South Plant',
          flocStatus: 'Operating',
          abcIndicatorName: 'B',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('keeps the first matches and says there are more when the limit is passed', async () => {
    stubModelViews(client, [assetView]);
    const nodes = Array.from({ length: ASSET_SEARCH_LIMIT + 1 }, (_item, index) =>
      makeNodeInstance(assetView, { space: 'instances', externalId: `FLOC-${index}` }, {}),
    );
    vi.spyOn(client.instances, 'search').mockResolvedValue({ items: nodes });

    const page = await createAssetService(client).searchAssets('pump');

    expect(page.items).toHaveLength(ASSET_SEARCH_LIMIT);
    expect(page.hasMore).toBe(true);
  });

  it('has no more matches when exactly the limit matched', async () => {
    stubModelViews(client, [assetView]);
    const nodes = Array.from({ length: ASSET_SEARCH_LIMIT }, (_item, index) =>
      makeNodeInstance(assetView, { space: 'instances', externalId: `FLOC-${index}` }, {}),
    );
    vi.spyOn(client.instances, 'search').mockResolvedValue({ items: nodes });

    const page = await createAssetService(client).searchAssets('pump');

    expect(page.items).toHaveLength(ASSET_SEARCH_LIMIT);
    expect(page.hasMore).toBe(false);
  });

  it('throws when the Asset view does not exist', async () => {
    stubModelViews(client, [makeViewDefinition('Equipment')]);

    await expect(createAssetService(client).searchAssets('pump')).rejects.toThrow(
      'The Asset view was not found in the Asset_Passport data model.',
    );
  });

  it('propagates search failures', async () => {
    stubModelViews(client, [assetView]);
    vi.spyOn(client.instances, 'search').mockRejectedValue(new Error('search failed'));

    await expect(createAssetService(client).searchAssets('pump')).rejects.toThrow('search failed');
  });
});
