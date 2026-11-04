import { describe, expect, it } from 'vitest';

import { ASSET_QUERY_LIMIT } from '../../constants/assets';
import { getAssetEquipmentDetails } from '../../services/assets/assetDetailsService';
import { listAssets } from '../../services/assets/assetService';
import { MOCK_ASSETS } from '../mockAssetData';
import { makeMockAssetDataClient, MOCK_PROJECT } from '../mockAssetDataClient';

// The real services run against the mock, so these tests show the dummy data
// is accepted exactly as a CDF response would be.
describe(makeMockAssetDataClient.name, () => {
  const client = makeMockAssetDataClient(0);

  it('identifies itself with a mock project for query keys', () => {
    expect(client.project).toBe(MOCK_PROJECT);
  });

  it('serves a first page of assets with the next cursor', async () => {
    const page = await listAssets(client);

    expect(page.items).toHaveLength(ASSET_QUERY_LIMIT);
    expect(page.nextCursor).not.toBeNull();
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        externalId: 'FLOC-1001',
        name: 'Cooling Water Pump 1',
        plantName: 'North Plant',
        flocStatus: 'Operating',
      }),
    );
  });

  it('pages through every asset exactly once and ends without a cursor', async () => {
    const externalIds: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await listAssets(client, cursor);
      externalIds.push(...page.items.map((item) => item.externalId));
      cursor = page.nextCursor ?? undefined;
    } while (cursor !== undefined);

    expect(externalIds).toHaveLength(MOCK_ASSETS.length);
    expect(new Set(externalIds).size).toBe(MOCK_ASSETS.length);
  });

  it('includes assets with missing values to exercise the empty labels', async () => {
    const page = await listAssets(client);

    expect(page.items.some((item) => item.description === null)).toBe(true);
  });

  it('serves the details of an asset with its linked equipment', async () => {
    const [asset] = MOCK_ASSETS;

    const details = await getAssetEquipmentDetails(client, {
      space: asset.space,
      externalId: asset.externalId,
    });

    expect(details.asset.externalId).toBe(asset.externalId);
    expect(details.asset.properties.map((p) => p.identifier)).toEqual(
      expect.arrayContaining(['name', 'plantName', 'flocStatus']),
    );
    expect(details.equipment.length).toBeGreaterThan(0);
  });

  it('leaves out system, relation and JSON properties like the app does', async () => {
    const [asset] = MOCK_ASSETS;

    const { asset: details } = await getAssetEquipmentDetails(client, {
      space: asset.space,
      externalId: asset.externalId,
    });
    const identifiers = details.properties.map((p) => p.identifier);

    expect(identifiers).not.toContain('sourceSystem');
    expect(identifiers).not.toContain('functionalLocationId');
    expect(identifiers).not.toContain('parent');
    expect(identifiers).not.toContain('metadata');
  });

  it('serves an asset with no equipment', async () => {
    const assetWithoutEquipment = MOCK_ASSETS[2];

    const details = await getAssetEquipmentDetails(client, {
      space: assetWithoutEquipment.space,
      externalId: assetWithoutEquipment.externalId,
    });

    expect(details.equipment).toEqual([]);
  });

  it('reports an unknown asset as not found, as CDF would return no node', async () => {
    await expect(
      getAssetEquipmentDetails(client, {
        space: 'mock-asset-instances',
        externalId: 'does-not-exist',
      }),
    ).rejects.toThrow('Asset does-not-exist was not found');
  });
});
