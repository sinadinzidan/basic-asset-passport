import { describe, expect, it } from 'vitest';

import type { EquipmentRecord, FileRecord } from '../../types/asset';
import { buildEquipmentPassports } from '../equipmentPassport';

describe('buildEquipmentPassports', () => {
  it('maps live equipment fields to a passport', () => {
    const equipment: EquipmentRecord = {
      id: '["asset_data","M-101"]', space: 'asset_data', externalId: 'M-101', name: 'Drive motor',
      description: 'Pump motor', area: 'Area 10', facility: 'Plant A',
      details: [
        { label: 'Manufacturer', value: 'ABB' }, { label: 'Serial number', value: 'SN-1' }, { label: 'Tag number', value: '10-M-101' },
        { label: 'Class', value: 'Motor' }, { label: 'System', value: 'Utilities' }, { label: 'Part number', value: 'PN-9' },
      ],
    };

    const [passport] = buildEquipmentPassports([equipment], 'Feed pump');

    expect(passport.asset).toEqual({ id: equipment.id, name: 'Drive motor', externalId: 'M-101', description: 'Pump motor', area: 'Area 10' });
    expect(passport.location).toBe('Plant A / Area 10');
    expect(passport.specifications).toEqual([
      { label: 'Manufacturer', value: 'ABB' },
      { label: 'Serial number', value: 'SN-1' },
      { label: 'Tag number', value: '10-M-101' },
      { label: 'Class', value: 'Motor' },
      { label: 'System', value: 'Utilities' },
      { label: 'Part number', value: 'PN-9' },
    ]);
  });

  it('omits fields that CDF does not provide instead of inventing values', () => {
    const [passport] = buildEquipmentPassports([{ id: 'm', space: 's', externalId: 'M-1', name: 'Motor', details: [] }], 'Feed pump');

    expect(passport.asset.description).toBeUndefined();
    expect(passport.asset.area).toBeUndefined();
    expect(passport.location).toBe('');
    expect(passport.specifications).toEqual([]);
    expect(passport.documents).toEqual([]);
  });

  it('lists a file once when the equipment links it more than once', () => {
    const file: FileRecord = { id: '["files","DOC-1"]', space: 'files', externalId: 'DOC-1', name: 'Motor datasheet' };
    const ref = { space: 'files', externalId: 'DOC-1' };

    const [passport] = buildEquipmentPassports(
      [{ id: 'm', space: 's', externalId: 'M-101', name: 'Drive motor', details: [], fileRefs: [ref, ref] }],
      'Feed pump',
      { equipmentFiles: [file], assetFiles: [file] }
    );

    expect(passport.documents.map((document) => document.id)).toEqual(['DOC-1']);
  });

  it('returns no passports when there is no equipment', () => {
    expect(buildEquipmentPassports([], 'Feed pump')).toEqual([]);
  });

  it('lists linked equipment files first, then asset files, without duplicates', () => {
    const equipment: EquipmentRecord = {
      id: 'm', space: 's', externalId: 'M-101', name: 'Drive motor', details: [],
      fileRefs: [{ space: 'files', externalId: 'DOC-1' }, { space: 'files', externalId: 'DOC-A' }],
    };
    const motorFile: FileRecord = { id: '["files","DOC-1"]', space: 'files', externalId: 'DOC-1', name: 'Motor datasheet', date: '2026-01-02' };
    const assetFile: FileRecord = { id: '["files","DOC-A"]', space: 'files', externalId: 'DOC-A', name: 'P&ID sheet', revision: 'C' };
    const otherAssetFile: FileRecord = { id: '["files","DOC-B"]', space: 'files', externalId: 'DOC-B', name: 'Layout' };

    const [passport] = buildEquipmentPassports([equipment], 'Feed pump', {
      equipmentFiles: [motorFile, assetFile], assetFiles: [assetFile, otherAssetFile],
    });

    expect(passport.documents).toEqual([
      { id: 'DOC-1', title: 'Motor datasheet', revision: '—', date: '2026-01-02', origin: 'Equipment file', instanceId: { space: 'files', externalId: 'DOC-1' } },
      { id: 'DOC-A', title: 'P&ID sheet', revision: 'C', date: '—', origin: 'Equipment file', instanceId: { space: 'files', externalId: 'DOC-A' } },
      { id: 'DOC-B', title: 'Layout', revision: '—', date: '—', origin: 'Asset file · Feed pump', instanceId: { space: 'files', externalId: 'DOC-B' } },
    ]);
  });

  it('shows asset files for equipment without its own files', () => {
    const equipment: EquipmentRecord = { id: 'm', space: 's', externalId: 'M-101', name: 'Drive motor', details: [] };
    const assetFile: FileRecord = { id: '["files","DOC-A"]', space: 'files', externalId: 'DOC-A', name: 'P&ID sheet' };

    const [withAssetFile] = buildEquipmentPassports([equipment], 'Feed pump', { equipmentFiles: [], assetFiles: [assetFile] });
    const [withoutFiles] = buildEquipmentPassports([equipment], 'Feed pump', { equipmentFiles: [], assetFiles: [] });

    expect(withAssetFile.documents).toEqual([
      { id: 'DOC-A', title: 'P&ID sheet', revision: '—', date: '—', origin: 'Asset file · Feed pump', instanceId: { space: 'files', externalId: 'DOC-A' } },
    ]);
    expect(withoutFiles.documents).toEqual([]);
  });
});
