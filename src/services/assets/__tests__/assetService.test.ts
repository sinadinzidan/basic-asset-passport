import { CogniteClient } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchAssetEquipment, fetchAssets, fetchRelatedFiles, searchAssets } from '../assetService';

afterEach(() => vi.restoreAllMocks());

function createClient() {
  return new CogniteClient({ appId: 'test', project: 'test', getToken: async () => 'test-token' });
}

describe('fetchAssets', () => {
  it('searches names and descriptions across the view and preserves composite identities', async () => {
    const client = createClient();
    const search = vi.spyOn(client.instances, 'search').mockResolvedValue({
      items: [{
        instanceType: 'node', space: 'assets', externalId: 'P-1', version: 1, createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyAsset/v1': { name: 'Feed pump', description: 'Boiler' } } },
      }],
    });
    expect(await searchAssets(client, 'pump')).toEqual([{
      id: '["assets","P-1"]', space: 'assets', externalId: 'P-1', name: 'Feed pump', description: 'Boiler',
    }]);
    expect(search).toHaveBeenCalledWith({
      view: { type: 'view', space: 'energy_dm', externalId: 'EnergyAsset', version: 'v1' },
      query: 'pump', properties: ['name', 'description'], operator: 'AND', limit: 1000,
    });
  });

  it('does not turn search failures or invalid results into empty matches', async () => {
    const client = createClient();
    const search = vi.spyOn(client.instances, 'search').mockRejectedValue(new Error('Forbidden'));
    await expect(searchAssets(client, 'pump')).rejects.toThrow('Forbidden');
    search.mockResolvedValue({ items: [{
      instanceType: 'node', space: 'assets', externalId: 'P-1', version: 1, createdTime: 0, lastUpdatedTime: 0,
      properties: { energy_dm: { 'EnergyAsset/v1': { name: 42 } } },
    }] });
    await expect(searchAssets(client, 'pump')).rejects.toThrow('Invalid name');
  });
  it('queries the requested view and selects only name and description', async () => {
    const client = createClient();
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue({
      items: { assets: [{
        instanceType: 'node', space: 'asset_data', externalId: 'P-101', version: 1,
        createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyAsset/v1': { name: 'Feed pump', description: 'Boiler feedwater' } } },
      }] },
      nextCursor: {},
    });

    expect(await fetchAssets(client, 10)).toEqual({
      items: [{
        id: '["asset_data","P-101"]', space: 'asset_data', externalId: 'P-101',
        name: 'Feed pump', description: 'Boiler feedwater',
      }],
      nextCursor: {},
    });
    expect(query).toHaveBeenCalledWith({
      with: { assets: { limit: 10, nodes: { filter: { hasData: [{ type: 'view', space: 'energy_dm', externalId: 'EnergyAsset', version: 'v1' }] } } } },
      select: { assets: { sources: [{ source: { type: 'view', space: 'energy_dm', externalId: 'EnergyAsset', version: 'v1' }, properties: ['name', 'description'] }] } },
    });
  });

  describe('fetchAssetEquipment', () => {
    it('queries EnergyEquipment nodes whose asset relation points to the selected asset', async () => {
      const client = createClient();
      const query = vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': {
            name: 'Drive motor', description: 'Pump motor', tagNumber: '10-M-101',
            files: [{ space: 'files', externalId: 'DOC-1' }],
          } } },
        }] },
        nextCursor: {},
      });

      expect(await fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25)).toEqual([{
        id: '["asset_data","M-101"]', space: 'asset_data', externalId: 'M-101',
        name: 'Drive motor', description: 'Pump motor',
        details: [{ label: 'Tag number', value: '10-M-101' }],
        fileRefs: [{ space: 'files', externalId: 'DOC-1' }],
      }]);
      const view = { type: 'view', space: 'energy_dm', externalId: 'EnergyEquipment', version: 'v1' };
      expect(query).toHaveBeenCalledWith({
        with: { equipment: { limit: 25, nodes: { filter: { and: [
          { hasData: [view] },
          { equals: { property: ['energy_dm', 'EnergyEquipment/v1', 'asset'], value: { space: 'asset_data', externalId: 'P-101' } } },
        ] } } } },
        select: { equipment: { sources: [{ source: view, properties: ['*'] }] } },
      });
    });

    it('returns no equipment when no nodes reference the asset', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({ items: { equipment: [] }, nextCursor: {} });

      expect(await fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25)).toEqual([]);
    });

    it('shows every readable property the view returns, whatever the model calls it', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': {
            name: 'Drive motor', asset: { space: 'asset_data', externalId: 'P-101' },
            vendor_name: 'ABB', maxPressure: 18.5, isCritical: true, installDate: '2019-04-12', aliases: ['M1', 'Motor 1'],
            serialNumber: 'SN-1', manufacturer: 'ABB', area: 'Compression', facility: 'North plant',
            owner: { space: 'people', externalId: 'maya' }, notes: '  ', tags: [{ space: 's', externalId: 'x' }],
          } } },
        }] },
        nextCursor: {},
      });

      const [equipment] = await fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25);

      expect(equipment.details).toEqual([
        { label: 'Manufacturer', value: 'ABB' },
        { label: 'Serial number', value: 'SN-1' },
        { label: 'Area', value: 'Compression' },
        { label: 'Facility', value: 'North plant' },
        { label: 'Vendor name', value: 'ABB' },
        { label: 'Max pressure', value: '18.5' },
        { label: 'Is critical', value: 'true' },
        { label: 'Install date', value: '2019-04-12' },
        { label: 'Aliases', value: 'M1, Motor 1' },
      ]);
      expect(equipment).toMatchObject({ area: 'Compression', facility: 'North plant' });
    });

    it('shows a timestamp at midnight UTC as a date and leaves other values alone', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': {
            installDate: '2019-04-12T00:00:00.000+00:00', commissioned: '2020-01-02T00:00:00Z', serviced: '2021-05-06T13:45:00.000+00:00', note: 'T00:00:00Z',
          } } },
        }] },
        nextCursor: {},
      });

      const [equipment] = await fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25);

      expect(equipment.details).toEqual([
        { label: 'Install date', value: '2019-04-12' },
        { label: 'Commissioned', value: '2020-01-02' },
        { label: 'Serviced', value: '2021-05-06T13:45:00.000+00:00' },
        { label: 'Note', value: 'T00:00:00Z' },
      ]);
    });

    it('keeps same-looking properties apart, shows readable list items and skips blank names', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': {
            name: '   ', description: ' ', serialNumber: 'SN-1', serial_number: 'SN-2', aliases: ['M1', { x: 1 }, '', 'Motor 1'],
          } } },
        }] },
        nextCursor: {},
      });

      const [equipment] = await fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25);

      expect(equipment.name).toBe('M-101');
      expect(equipment.description).toBeUndefined();
      expect(equipment.details).toEqual([
        { label: 'Serial number', value: 'SN-1' },
        { label: 'Serial number (serial_number)', value: 'SN-2' },
        { label: 'Aliases', value: 'M1, Motor 1' },
      ]);
    });

    it('rejects a non-string name', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': { name: 7 } } },
        }] },
        nextCursor: {},
      });

      await expect(fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25)).rejects.toThrow('Invalid name property');
    });

    it('rejects malformed file relations', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { equipment: [{
          instanceType: 'node', space: 'asset_data', externalId: 'M-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
          properties: { energy_dm: { 'EnergyEquipment/v1': { files: ['DOC-1'] } } },
        }] },
        nextCursor: {},
      });

      await expect(fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25)).rejects.toThrow('Invalid files property');
    });

    it('propagates failures while retrieving equipment', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('Forbidden'));

      await expect(fetchAssetEquipment(client, { space: 'asset_data', externalId: 'P-101' }, 25)).rejects.toThrow('Forbidden');
    });
  });

  it('falls back to the external ID when an asset name or file name is only spaces', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockResolvedValue({
      items: { assets: [{
        instanceType: 'node', space: 'assets', externalId: 'P-9', version: 1, createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyAsset/v1': { name: '  ', description: '\n' } } },
      }] },
      nextCursor: {},
    });
    expect((await fetchAssets(client, 10)).items).toEqual([
      { id: '["assets","P-9"]', space: 'assets', externalId: 'P-9', name: 'P-9', description: undefined },
    ]);
  });

  it('handles empty results', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockResolvedValue({ items: { assets: [] }, nextCursor: {} });
    expect(await fetchAssets(client, 10)).toEqual({ items: [], nextCursor: {} });
  });

  it('uses the external ID for unnamed nodes and distinguishes instance spaces', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockResolvedValue({
      items: { assets: ['one', 'two'].map((space) => ({
        instanceType: 'node', space, externalId: 'shared-id', version: 1, createdTime: 0, lastUpdatedTime: 0,
      })) },
      nextCursor: {},
    });
    const assets = await fetchAssets(client, 10);
    expect(assets.items.map((asset) => asset.name)).toEqual(['shared-id', 'shared-id']);
    expect(assets.items[0].id).not.toBe(assets.items[1].id);
  });

  it('passes query cursors through unchanged and returns the next cursor', async () => {
    const client = createClient();
    const cursor = { assets: 'opaque/cursor+=' };
    const nextCursor = { assets: 'next/opaque+=' };
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue({
      items: { assets: [] },
      nextCursor,
    });

    expect(await fetchAssets(client, 10, cursor)).toEqual({ items: [], nextCursor });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ cursors: cursor }));
  });

  it('rejects invalid properties instead of treating them as empty data', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockResolvedValue({
      items: { assets: [{
        instanceType: 'node', space: 'test', externalId: 'P-101', version: 1, createdTime: 0, lastUpdatedTime: 0,
        properties: { energy_dm: { 'EnergyAsset/v1': { name: 123 } } },
      }] },
      nextCursor: {},
    });
    await expect(fetchAssets(client, 10)).rejects.toThrow('Invalid name property');
  });

  it('rejects a missing result set', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockResolvedValue({ items: {}, nextCursor: {} });
    await expect(fetchAssets(client, 10)).rejects.toThrow('did not return the assets result set');
  });

  it('propagates SDK failures', async () => {
    const client = createClient();
    vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('Forbidden'));
    await expect(fetchAssets(client, 10)).rejects.toThrow('Forbidden');
  });

  describe('fetchRelatedFiles', () => {
    const fileView = { type: 'view', space: 'energy_dm', externalId: 'EnergyFile', version: 'v1' };

    it('queries files linked to the asset and retrieves files referenced by equipment', async () => {
      const client = createClient();
      const query = vi.spyOn(client.instances, 'query').mockResolvedValue({
        items: { files: [createFileNode('DOC-A', { name: 'P&ID sheet', revision: 'C', mimeType: 'application/pdf', issueDate: '2026-02-10T00:00:00.000Z' })] },
        nextCursor: {},
      });
      const retrieve = vi.spyOn(client.instances, 'retrieve').mockResolvedValue({
        items: [createFileNode('DOC-1', { name: 'Motor datasheet', description: 'Rated data' })],
      });

      const result = await fetchRelatedFiles(client, { space: 'asset_data', externalId: 'P-101' }, [{ space: 'files', externalId: 'DOC-1' }], 50);

      expect(result).toEqual({
        assetFiles: [{ id: '["files","DOC-A"]', space: 'files', externalId: 'DOC-A', name: 'P&ID sheet', revision: 'C', mimeType: 'application/pdf', date: '2026-02-10' }],
        equipmentFiles: [{ id: '["files","DOC-1"]', space: 'files', externalId: 'DOC-1', name: 'Motor datasheet', description: 'Rated data' }],
      });
      expect(query).toHaveBeenCalledWith({
        with: { files: { limit: 50, nodes: { filter: { containsAny: {
          property: ['energy_dm', 'EnergyFile/v1', 'assets'],
          values: [{ space: 'asset_data', externalId: 'P-101' }],
        } } } } },
        select: { files: { sources: [{ source: fileView, properties: ['name', 'description', 'mimeType', 'revision', 'issueDate', 'uploadedTime'] }] } },
      });
      expect(retrieve).toHaveBeenCalledWith({
        items: [{ instanceType: 'node', space: 'files', externalId: 'DOC-1' }],
        sources: [{ source: fileView }],
      });
    });

    it('skips retrieval when equipment references no files', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockResolvedValue({ items: { files: [] }, nextCursor: {} });
      const retrieve = vi.spyOn(client.instances, 'retrieve');

      expect(await fetchRelatedFiles(client, { space: 'asset_data', externalId: 'P-101' }, [], 50)).toEqual({ assetFiles: [], equipmentFiles: [] });
      expect(retrieve).not.toHaveBeenCalled();
    });

    it('propagates file request failures', async () => {
      const client = createClient();
      vi.spyOn(client.instances, 'query').mockRejectedValue(new Error('Forbidden'));

      await expect(fetchRelatedFiles(client, { space: 'asset_data', externalId: 'P-101' }, [], 50)).rejects.toThrow('Forbidden');
    });
  });
});

function createFileNode(externalId: string, properties: Record<string, string>) {
  return {
    instanceType: 'node' as const, space: 'files', externalId, version: 1, createdTime: 0, lastUpdatedTime: 0,
    properties: { energy_dm: { 'EnergyFile/v1': properties } },
  };
}
