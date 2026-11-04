import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ASSET_EQUIPMENT_QUERY_LIMIT } from '../../../constants/assets';
import {
  makeNodeInstance,
  makeQueryResponse,
  makeViewDefinition,
} from '../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubViewList,
} from '../../../mocks/cogniteClient';
import { getAssetEquipmentDetails } from '../assetDetailsService';

const assetView = makeViewDefinition('Asset', {
  name: { label: 'Name' },
  plantName: {},
  source: { label: 'Source' },
  parent: { type: 'direct' },
  metadata: { type: 'json' },
});
const equipmentView = makeViewDefinition('Equipment', {
  name: { label: 'Name' },
  tags: { label: 'Tags' },
});
const assetIdentifier = { space: 'instances', externalId: 'FLOC-1' };

describe(getAssetEquipmentDetails.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubViewList(client, [assetView, equipmentView]);
  });

  it('queries the asset and its inbound equipment, skipping internal and relation properties', async () => {
    // Arrange
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ asset: [], equipment: [] }));

    // Act
    await getAssetEquipmentDetails(client, assetIdentifier).catch(() => {});

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
      equipment: {
        sources: [
          {
            source: expect.objectContaining({ externalId: 'Equipment' }),
            properties: ['name', 'tags'],
          },
        ],
      },
    });
    expect(request.with.asset).toEqual(expect.objectContaining({ limit: 1 }));
    expect(request.with.equipment).toEqual(
      expect.objectContaining({
        limit: ASSET_EQUIPMENT_QUERY_LIMIT,
        nodes: expect.objectContaining({
          from: 'asset',
          direction: 'inwards',
        }),
      }),
    );
  });

  it('formats property values for display and omits empty ones', async () => {
    // Arrange
    const assetNode = makeNodeInstance(assetView, assetIdentifier, {
      name: ' Cooling Water Pump ',
      plantName: '',
    });
    const equipmentNode = makeNodeInstance(
      equipmentView,
      { space: 'instances', externalId: 'P-100' },
      { name: 'Pump', tags: ['A', 7, true, '', { id: 1 }] },
    );
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [assetNode], equipment: [equipmentNode] }),
    );

    // Act
    const details = await getAssetEquipmentDetails(client, assetIdentifier);

    // Assert
    expect(details.asset).toEqual({
      ...assetIdentifier,
      properties: [
        { identifier: 'name', label: 'Name', value: 'Cooling Water Pump' },
      ],
    });
    expect(details.equipment).toEqual([
      {
        space: 'instances',
        externalId: 'P-100',
        properties: [
          { identifier: 'name', label: 'Name', value: 'Pump' },
          { identifier: 'tags', label: 'Tags', value: 'A, 7, true, {"id":1}' },
        ],
      },
    ]);
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
    stubViewList(client, [richView, equipmentView]);
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
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [node] }),
    );

    // Act
    const { asset } = await getAssetEquipmentDetails(client, assetIdentifier);

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
    stubViewList(client, [unnamedView, equipmentView]);
    const node = makeNodeInstance(unnamedView, assetIdentifier, {
      plantCode: 'G307',
      blankLabel: 'x',
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [node] }),
    );

    const { asset } = await getAssetEquipmentDetails(client, assetIdentifier);

    expect(asset.properties.map(({ label }) => label)).toEqual([
      'plantCode',
      'blankLabel',
    ]);
  });

  it('skips edges returned among the equipment', async () => {
    const assetNode = makeNodeInstance(assetView, assetIdentifier, {
      name: 'Pump',
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        asset: [assetNode],
        equipment: [
          {
            instanceType: 'edge',
            space: 's',
            externalId: 'e',
            version: 1,
            createdTime: 0,
            lastUpdatedTime: 0,
            type: { space: 's', externalId: 't' },
            startNode: { space: 's', externalId: 'a' },
            endNode: { space: 's', externalId: 'b' },
          },
        ],
      }),
    );

    const details = await getAssetEquipmentDetails(client, assetIdentifier);

    expect(details.equipment).toEqual([]);
  });

  it('returns no equipment when none is linked', async () => {
    const assetNode = makeNodeInstance(assetView, assetIdentifier, {
      name: 'Pump',
    });
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [assetNode] }),
    );

    const details = await getAssetEquipmentDetails(client, assetIdentifier);

    expect(details.equipment).toEqual([]);
  });

  it('throws when the response has no asset result set', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({}),
    );

    await expect(
      getAssetEquipmentDetails(client, assetIdentifier),
    ).rejects.toThrow('Asset FLOC-1 was not found in instances.');
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
    stubViewList(client, [viewWithReverseRelation, equipmentView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ asset: [] }));

    // Act
    await getAssetEquipmentDetails(client, assetIdentifier).catch(() => {});

    // Assert
    const { select } = query.mock.calls[0][0];
    expect(select.asset.sources?.[0].properties).toEqual(['name', 'plantName']);
  });

  it('throws when the asset is not found', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ asset: [] }),
    );

    await expect(
      getAssetEquipmentDetails(client, assetIdentifier),
    ).rejects.toThrow('Asset FLOC-1 was not found in instances.');
  });

  it('throws when the Equipment view does not exist', async () => {
    stubViewList(client, [assetView]);

    await expect(
      getAssetEquipmentDetails(client, assetIdentifier),
    ).rejects.toThrow(
      'The Asset and Equipment views must exist in sp-dm-idi-asset.',
    );
  });

  it('propagates query failures', async () => {
    vi.spyOn(client.instances, 'query').mockRejectedValue(
      new Error('query failed'),
    );

    await expect(
      getAssetEquipmentDetails(client, assetIdentifier),
    ).rejects.toThrow('query failed');
  });
});
