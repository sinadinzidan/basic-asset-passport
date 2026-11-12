import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNodeInstance, makeQueryResponse, makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { TestPropertyType } from '../../../enums/testPropertyType';
import { getAssetDetails } from '../assetDetails';

const assetView = makeViewDefinition('Asset', {
  name: { label: 'Name' },
  plantName: {},
  source: { label: 'Source' },
  parent: { type: TestPropertyType.DIRECT },
  metadata: { type: TestPropertyType.JSON },
});
const assetIdentifier = { space: 'instances', externalId: 'FLOC-1' };

describe(getAssetDetails.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [assetView]);
  });

  it('queries only the asset, skipping internal and relation properties', async () => {
    // Arrange
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ asset: [] }));

    // Act
    await getAssetDetails(client, assetIdentifier).catch(() => {});

    // Assert
    const request = query.mock.calls[0][0];
    expect(request.select).toEqual({
      asset: {
        sources: [
          {
            source: expect.objectContaining({ externalId: 'Asset' }),
            properties: ['name', 'plantName'],
          },
        ],
      },
    });
    expect(Object.keys(request.with)).toEqual(['asset']);
    expect(request.with.asset).toEqual(expect.objectContaining({ limit: 1 }));
  });

  it('asks for the node with the asset space and external ID that has Asset data', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ asset: [] }));

    await getAssetDetails(client, assetIdentifier).catch(() => {});

    expect(query.mock.calls[0]?.[0].with.asset).toMatchObject({
      nodes: {
        filter: {
          and: [
            { equals: { property: ['node', 'space'], value: 'instances' } },
            { equals: { property: ['node', 'externalId'], value: 'FLOC-1' } },
            { hasData: [expect.objectContaining({ externalId: 'Asset' })] },
          ],
        },
      },
    });
  });

  it('formats property values for display and omits empty ones', async () => {
    // Arrange
    const assetNode = makeNodeInstance(assetView, assetIdentifier, {
      name: ' Cooling Water Pump ',
      plantName: '',
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [assetNode] }),
    );

    // Act
    const asset = await getAssetDetails(client, assetIdentifier);

    // Assert
    expect(asset).toEqual({
      ...assetIdentifier,
      properties: [{ identifier: 'name', label: 'Name', value: 'Cooling Water Pump' }],
    });
  });

  it('formats each kind of property value and drops those with nothing to show', async () => {
    // Arrange
    const richView = makeViewDefinition('Asset', {
      count: { label: 'Count' },
      isActive: { label: 'Active' },
      zero: { label: 'Zero' },
      notANumber: { label: 'Not a number' },
      infinite: { label: 'Infinite' },
      emptyList: { label: 'Empty list' },
      emptyObject: { label: 'Empty object' },
      nested: { label: 'Nested' },
      missing: { label: 'Missing' },
    });
    stubModelViews(client, [richView]);
    const node = makeNodeInstance(richView, assetIdentifier, {
      count: 12.5,
      isActive: false,
      zero: 0,
      notANumber: Number.NaN,
      infinite: Number.POSITIVE_INFINITY,
      emptyList: [],
      emptyObject: {},
      nested: [['a', 'b'], [], 'c'],
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ asset: [node] }));

    // Act
    const asset = await getAssetDetails(client, assetIdentifier);

    // Assert
    expect(asset.properties).toEqual([
      { identifier: 'count', label: 'Count', value: '12.5' },
      { identifier: 'isActive', label: 'Active', value: 'false' },
      { identifier: 'zero', label: 'Zero', value: '0' },
      { identifier: 'nested', label: 'Nested', value: 'a, b, c' },
    ]);
  });

  it('labels a property with its identifier when the view gives no name', async () => {
    const unnamedView = makeViewDefinition('Asset', {
      plantCode: {},
      blankLabel: { label: '   ' },
    });
    stubModelViews(client, [unnamedView]);
    const node = makeNodeInstance(unnamedView, assetIdentifier, {
      plantCode: 'G307',
      blankLabel: 'x',
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ asset: [node] }));

    const asset = await getAssetDetails(client, assetIdentifier);

    expect(asset.properties.map(({ label }) => label)).toEqual(['plantCode', 'blankLabel']);
  });

  it('throws when the response has no asset result set', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({}));

    await expect(getAssetDetails(client, assetIdentifier)).rejects.toThrow(
      'Asset FLOC-1 was not found in instances.',
    );
  });

  it('skips view properties that are not mapped to a container', async () => {
    // Arrange: a reverse relation is defined by the view and has no container.
    const viewWithReverseRelation = {
      ...assetView,
      properties: {
        ...assetView.properties,
        children: {
          connectionType: 'multi_reverse_direct_relation' as const,
          targetsList: true,
          source: {
            type: 'view' as const,
            space: assetView.space,
            externalId: 'Asset',
            version: assetView.version,
          },
          through: {
            source: {
              type: 'view' as const,
              space: assetView.space,
              externalId: 'Asset',
              version: assetView.version,
            },
            identifier: 'parent',
          },
        },
      },
    };
    stubModelViews(client, [viewWithReverseRelation]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ asset: [] }));

    // Act
    await getAssetDetails(client, assetIdentifier).catch(() => {});

    // Assert
    const { select } = query.mock.calls[0][0];
    expect(select.asset.sources?.[0].properties).toEqual(['name', 'plantName']);
  });

  it('throws when the asset is not found', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ asset: [] }));

    await expect(getAssetDetails(client, assetIdentifier)).rejects.toThrow(
      'Asset FLOC-1 was not found in instances.',
    );
  });

  it('throws when the Asset view does not exist', async () => {
    stubModelViews(client, []);

    await expect(getAssetDetails(client, assetIdentifier)).rejects.toThrow(
      'The Asset view was not found in the Asset_Passport data model.',
    );
  });

  it('propagates query failures', async () => {
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('query failed'));

    await expect(getAssetDetails(client, assetIdentifier)).rejects.toThrow('query failed');
  });
});
