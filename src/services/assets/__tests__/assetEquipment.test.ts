import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNodeInstance, makeQueryResponse, makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { ASSET_EQUIPMENT_QUERY_LIMIT } from '../../../constants/assets';
import { TestPropertyType } from '../../../enums/testPropertyType';
import { createAssetEquipmentService } from '../assetEquipment';

const equipmentView = makeViewDefinition('Equipment', {
  name: { label: 'Name' },
  tags: { label: 'Tags' },
  source: { label: 'Source' },
  asset: { type: TestPropertyType.DIRECT },
});
const assetIdentifier = { space: 'instances', externalId: 'FLOC-1' };

describe('listAssetEquipment', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [equipmentView]);
  });

  it('queries the Equipment nodes whose asset relation is the asset, skipping internal and relation properties', async () => {
    // Arrange
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ equipment: [] }));

    // Act
    await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier);

    // Assert
    const reference = expect.objectContaining({ externalId: 'Equipment' });
    const request = query.mock.calls[0][0];

    expect(request.with.equipment).toMatchObject({
      nodes: {
        filter: {
          and: [
            { hasData: [reference] },
            {
              equals: {
                property: [equipmentView.space, `Equipment/${equipmentView.version}`, 'asset'],
                value: { space: 'instances', externalId: 'FLOC-1' },
              },
            },
          ],
        },
      },
    });
    expect(request.select).toEqual({
      equipment: {
        sources: [{ source: reference, properties: ['name', 'tags'] }],
      },
    });
  });

  it('has the server sort the equipment by name, then external ID, and asks for one more than the limit', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ equipment: [] }));

    await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier);

    expect(query.mock.calls[0]?.[0].with.equipment).toMatchObject({
      limit: ASSET_EQUIPMENT_QUERY_LIMIT + 1,
      sort: [
        {
          property: [equipmentView.space, `Equipment/${equipmentView.version}`, 'name'],
          direction: 'ascending',
          nullsFirst: false,
        },
        {
          property: ['node', 'externalId'],
          direction: 'ascending',
          nullsFirst: false,
        },
      ],
    });
  });

  it('reads a longer list when given a longer limit', async () => {
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ equipment: [] }));

    await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier, 50);

    expect(query.mock.calls[0]?.[0].with.equipment).toMatchObject({
      limit: 51,
    });
  });

  it('keeps the equipment within the limit and says that more exist', async () => {
    const equipment = Array.from({ length: ASSET_EQUIPMENT_QUERY_LIMIT + 1 }, (_item, index) =>
      makeNodeInstance(equipmentView, { space: 'instances', externalId: `P-${index}` }, {}),
    );

    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ equipment }));

    const list = await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier);

    expect(list.items).toHaveLength(ASSET_EQUIPMENT_QUERY_LIMIT);
    expect(list.hasMore).toBe(true);
  });

  it('formats property values for display and omits empty ones', async () => {
    const node = makeNodeInstance(
      equipmentView,
      { space: 'instances', externalId: 'P-100' },
      { name: 'Pump', tags: ['A', 7, true, '', { id: 1 }] },
    );

    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({ equipment: [node] }));

    const list = await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier);

    expect(list.items).toEqual([
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

  it('skips edges returned among the equipment', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
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

    const list = await createAssetEquipmentService(client).listAssetEquipment(assetIdentifier);

    expect(list.items).toEqual([]);
  });

  it('returns an empty list when no equipment is linked', async () => {
    vi.spyOn(client.instances, 'query').mockResolvedValue(makeQueryResponse({}));

    await expect(
      createAssetEquipmentService(client).listAssetEquipment(assetIdentifier),
    ).resolves.toEqual({
      items: [],
      hasMore: false,
    });
  });

  it('fails with a readable message when the model has no Equipment view', async () => {
    stubModelViews(client, []);

    await expect(
      createAssetEquipmentService(client).listAssetEquipment(assetIdentifier),
    ).rejects.toThrow('The Equipment view was not found in the Asset_Passport data model.');
  });

  it('propagates query failures', async () => {
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('query failed'));

    await expect(
      createAssetEquipmentService(client).listAssetEquipment(assetIdentifier),
    ).rejects.toThrow('query failed');
  });
});
