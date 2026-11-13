import type { AggregationResponse, CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { TestPropertyType } from '../../../enums/testPropertyType';
import { createAssetDetailsTabCountService } from '../assetDetailsTabCounts';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const asset = { space: 'asset-space', externalId: 'FLOC-1' };

const equipmentView = makeViewDefinition(
  'Equipment',
  { asset: { type: TestPropertyType.DIRECT } },
  'v1',
  'sp-model',
);
const noteView = makeViewDefinition(
  'Note',
  { asset: { type: TestPropertyType.DIRECT } },
  'v1',
  'sp-model',
);
const documentView = makeViewDefinition(
  'Document',
  { asset: { type: TestPropertyType.DIRECT } },
  'v1',
  'sp-model',
);
const timeseriesView = makeViewDefinition(
  'PI_Timeseries',
  { assets: { type: TestPropertyType.DIRECT } },
  'v1',
  'sp-dm-idi-rmdm',
);

describe('asset count service', () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [noteView, documentView, timeseriesView, equipmentView]);
  });

  describe('countAssetNotes', () => {
    it('counts the Note nodes whose asset relation is the asset, without reading them or any property', async () => {
      // Arrange
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(4));
      const query = vi.spyOn(client.instances, 'query');

      // Act
      const count =
        await createAssetDetailsTabCountService(client).countAssetNotes(assetIdentifier);

      // Assert
      const reference = {
        type: 'view',
        space: 'sp-model',
        externalId: 'Note',
        version: 'v1',
      };

      expect(count).toBe(4);
      expect(query).not.toHaveBeenCalled();
      expect(aggregate).toHaveBeenCalledWith({
        view: reference,
        instanceType: 'node',
        aggregates: [{ count: { property: 'externalId' } }],
        filter: {
          equals: {
            property: ['sp-model', 'Note/v1', 'asset'],
            value: asset,
          },
        },
      });
    });

    it('counts none when the answer holds no count', async () => {
      vi.spyOn(client.instances, 'aggregate').mockResolvedValue({ items: [] });

      await expect(
        createAssetDetailsTabCountService(client).countAssetNotes(assetIdentifier),
      ).resolves.toBe(0);
    });

    it('fails with a readable message when the model has no Note view', async () => {
      stubModelViews(client, []);

      await expect(
        createAssetDetailsTabCountService(client).countAssetNotes(assetIdentifier),
      ).rejects.toThrow('The Note view was not found in the Asset_Passport data model.');
    });

    it('passes on a failure of the aggregate request', async () => {
      vi.spyOn(client.instances, 'aggregate').mockRejectedValue(new Error('Forbidden'));

      await expect(
        createAssetDetailsTabCountService(client).countAssetNotes(assetIdentifier),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('countAssetDocuments', () => {
    it('counts the Document nodes whose asset relation is the asset', async () => {
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(2));

      const count =
        await createAssetDetailsTabCountService(client).countAssetDocuments(assetIdentifier);

      const reference = {
        type: 'view',
        space: 'sp-model',
        externalId: 'Document',
        version: 'v1',
      };

      expect(count).toBe(2);
      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          view: reference,
          filter: {
            equals: {
              property: ['sp-model', 'Document/v1', 'asset'],
              value: asset,
            },
          },
        }),
      );
    });
  });

  describe('countAssetEquipment', () => {
    it('counts the Equipment nodes whose asset relation is the asset', async () => {
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(1500));

      const count =
        await createAssetDetailsTabCountService(client).countAssetEquipment(assetIdentifier);

      const reference = {
        type: 'view',
        space: 'sp-model',
        externalId: 'Equipment',
        version: 'v1',
      };

      expect(count).toBe(1500);
      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          view: reference,
          filter: {
            equals: {
              property: ['sp-model', 'Equipment/v1', 'asset'],
              value: asset,
            },
          },
        }),
      );
    });
  });

  describe('countAssetTimeseries', () => {
    it('counts the PI_Timeseries nodes whose assets include the asset', async () => {
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(312));

      const count =
        await createAssetDetailsTabCountService(client).countAssetTimeseries(assetIdentifier);

      const reference = {
        type: 'view',
        space: 'sp-dm-idi-rmdm',
        externalId: 'PI_Timeseries',
        version: 'v1',
      };

      expect(count).toBe(312);
      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          view: reference,
          filter: {
            containsAny: {
              property: ['sp-dm-idi-rmdm', 'PI_Timeseries/v1', 'assets'],
              values: [asset],
            },
          },
        }),
      );
    });
  });

  describe('countAssetLinkedFiles', () => {
    it('counts the Files nodes whose assets include the asset, by the view reference', async () => {
      const aggregate = vi
        .spyOn(client.instances, 'aggregate')
        .mockResolvedValue(makeCountResponse(9));
      const retrieve = vi.spyOn(client.dataModels, 'retrieve');

      const count =
        await createAssetDetailsTabCountService(client).countAssetLinkedFiles(assetIdentifier);

      const reference = {
        type: 'view',
        space: 'sp-dm-idi-rmdm',
        externalId: 'Files',
        version: 'v1',
      };

      expect(count).toBe(9);
      expect(retrieve).not.toHaveBeenCalled();
      expect(aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          view: reference,
          filter: {
            containsAny: {
              property: ['sp-dm-idi-rmdm', 'Files/v1', 'assets'],
              values: [asset],
            },
          },
        }),
      );
    });
  });
});

function makeCountResponse(value: number): AggregationResponse {
  return {
    items: [
      {
        instanceType: 'node',
        aggregates: [{ aggregate: 'count', value }],
      },
    ],
  };
}
