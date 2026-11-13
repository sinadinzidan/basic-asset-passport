import type { AggregationResponse, CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { TestPropertyType } from '../../../enums/testPropertyType';
import { createAssetSummaryService } from '../assetSummary';

const assetView = makeViewDefinition('Asset', { flocStatus: {} }, 'v1', 'sp-model');
const equipmentView = makeViewDefinition(
  'Equipment',
  { asset: { type: TestPropertyType.DIRECT } },
  'v1',
  'sp-model',
);
const assetReference = { type: 'view', space: 'sp-model', externalId: 'Asset', version: 'v1' };
const equipmentReference = {
  type: 'view',
  space: 'sp-model',
  externalId: 'Equipment',
  version: 'v1',
};

describe('asset summary count service', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [assetView, equipmentView]);
  });

  describe('countAllAssets', () => {
    it('counts every node with Asset data, whatever its relations, reading none of them', async () => {
      // Arrange
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(4210));
      const query = vi.spyOn(client.instances, 'query');

      // Act
      const count = await createAssetSummaryService(client).countAllAssets();

      // Assert
      expect(count).toBe(4210);
      expect(query).not.toHaveBeenCalled();
      expect(aggregate).toHaveBeenCalledWith({
        view: assetReference,
        instanceType: 'node',
        aggregates: [{ count: { property: 'externalId' } }],
      });
    });

    it('counts none when the answer holds no count', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue({ items: [] });

      await expect(createAssetSummaryService(client).countAllAssets()).resolves.toBe(0);
    });

    it('fails when the Asset view does not exist', async () => {
      stubModelViews(client, []);

      await expect(createAssetSummaryService(client).countAllAssets()).rejects.toThrow(
        'The Asset view was not found in the Asset_Passport data model.',
      );
    });

    it('passes on a failure of the aggregate request', async () => {
      vi.spyOn(client.instances, 'aggregate').mockRejectedValue(new Error('forbidden'));

      await expect(createAssetSummaryService(client).countAllAssets()).rejects.toThrow('forbidden');
    });
  });

  describe('countOperatingAssets', () => {
    it('asks for a count for each status, as many groups as the API gives', async () => {
      // Arrange
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeGroupedResponse({ Operating: 3 }));

      // Act
      await createAssetSummaryService(client).countOperatingAssets();

      // Assert
      expect(aggregate).toHaveBeenCalledWith({
        view: assetReference,
        instanceType: 'node',
        groupBy: ['flocStatus'],
        aggregates: [{ count: { property: 'externalId' } }],
        limit: 1000,
      });
    });

    it('adds up the statuses that read as Operating, however they are cased or spaced', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue(
        makeGroupedResponse({
          Operating: 40,
          'operating ': 2,
          'IN SERVICE': 7,
          Decommissioned: 1,
        }),
      );

      await expect(createAssetSummaryService(client).countOperatingAssets()).resolves.toBe(42);
    });

    it('counts none when no status is Operating', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue(
        makeGroupedResponse({ Decommissioned: 5 }),
      );

      await expect(createAssetSummaryService(client).countOperatingAssets()).resolves.toBe(0);
    });

    it('counts none when the answer holds no group', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue({ items: [] });

      await expect(createAssetSummaryService(client).countOperatingAssets()).resolves.toBe(0);
    });

    it('leaves out a group without a status, which is not Operating', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue({
        items: [
          { instanceType: 'node', aggregates: [{ aggregate: 'count', value: 9 }] },
          ...makeGroupedResponse({ Operating: 1 }).items,
        ],
      });

      await expect(createAssetSummaryService(client).countOperatingAssets()).resolves.toBe(1);
    });
  });

  describe('countAllEquipment', () => {
    it('counts every node with Equipment data, whatever asset it belongs to', async () => {
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(18500));

      const count = await createAssetSummaryService(client).countAllEquipment();

      expect(count).toBe(18500);
      expect(aggregate).toHaveBeenCalledWith({
        view: equipmentReference,
        instanceType: 'node',
        aggregates: [{ count: { property: 'externalId' } }],
      });
    });

    it('fails when the Equipment view does not exist', async () => {
      stubModelViews(client, [assetView]);

      await expect(createAssetSummaryService(client).countAllEquipment()).rejects.toThrow(
        'The Equipment view was not found in the Asset_Passport data model.',
      );
    });
  });
});

function makeCountResponse(value: number): AggregationResponse {
  return {
    items: [{ instanceType: 'node', aggregates: [{ aggregate: 'count', value }] }],
  };
}

function makeGroupedResponse(countsByStatus: Record<string, number>): AggregationResponse {
  return {
    items: Object.entries(countsByStatus).map(([status, value]) => ({
      instanceType: 'node',
      group: { flocStatus: status },
      aggregates: [{ aggregate: 'count', value }],
    })),
  };
}
